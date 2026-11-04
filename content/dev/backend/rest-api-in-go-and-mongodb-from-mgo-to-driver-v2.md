---
title: "REST API in Go and MongoDB: from mgo to driver v2"
date: 2026-11-04
description: "A Go REST API on MongoDB rebuilt for 2026: the official driver v2, ServeMux method patterns from Go 1.22 and CORS preflight handled in middleware."
tags:
  - dev
  - backend
  - go
  - mongodb
---

> [!tldr]
> A 2017 Go REST API on MongoDB used `mgo`, `gorilla/mux` and `gorilla/handlers`. In 2026 the same service needs **the official driver v2 and nothing but the standard library for routing**: `go.mongodb.org/mongo-driver/v2` (v2.9.3, Go 1.25 or newer) for storage, and `net/http` patterns with methods and wildcards, available since Go 1.22. CORS is still yours to write, and the classic failure is still a preflight request that the router answers with an error. The service below ran on Go 1.27.3 and MongoDB 8.0.34.

## What the 2017 version used

In March 2017 I wrote the backend of a contest app called Shopping Manager in Go, with MongoDB behind it. I wrote the original walkthrough in Polish: the first endpoint and a bare `http.ListenAndServe` server are in [Go Programming Language - startujemy!](https://dawidrylko.com/go-programming-language-startujemy/) (in Polish), and the database side, with `gopkg.in/mgo.v2`, in [MongoDB i mgo](https://dawidrylko.com/mongodb-i-mgo-czyli-kilka-slow-o-bazie-danych-dla-jezyka-go/) (in Polish). Routing went through `gorilla/mux`, and in April I added `gorilla/handlers` for CORS.

Of those three libraries, **only `mgo` is a real problem today**. The README of `go-mgo/mgo` opens with "THIS IS UNMAINTAINED", explains that its author is pausing maintenance and points to the `globalsign/mgo` fork. The fork's README lists integration tests against MongoDB 3.0 to 3.6, with 4.0 marked experimental. I flagged this myself in December 2023, when I added an update note to those posts recommending the official driver.

The Gorilla toolkit is in better shape than that. Its organisation announced a new group of core maintainers in July 2023, and the latest tags, `gorilla/mux` v1.8.1 and `gorilla/handlers` v1.5.2, date from October 2023. Whether to keep them is a decision per library, and the next sections make it for routing and for CORS.

## From mgo to the official driver

The driver maintained by MongoDB is on its second major version. the current release at the time of writing is v2.9.3, its README asks for Go 1.25 or newer and MongoDB 4.4 or newer, and the major version is part of the import path: `go.mongodb.org/mongo-driver/v2/mongo`. The v1 line still gets releases (v1.17.10 in September 2026), but there is no reason to start new code on it.

Most of the change is a rename, and a table shows it faster than prose:

| Task | mgo (2017) | driver v2 |
| --- | --- | --- |
| Import | `gopkg.in/mgo.v2`, `gopkg.in/mgo.v2/bson` | `go.mongodb.org/mongo-driver/v2/mongo`, `.../bson`, `.../mongo/options` |
| Connect | `mgo.Dial(url)` returns a `*mgo.Session` | `mongo.Connect(options.Client().ApplyURI(url))` returns a `*mongo.Client` |
| Handle per request | a session from `GetSession()`, released with `FinishSession` | none, one `Client` for the whole process |
| ID type | `bson.ObjectId`, `bson.NewObjectId()` | `bson.ObjectID`, `bson.NewObjectID()` |
| Hex string to ID | `bson.ObjectIdHex(s)`, panics on bad input | `bson.ObjectIDFromHex(s)`, returns an error |
| Create | `Insert(p)` | `InsertOne(ctx, p)` |
| List | `Find(nil).All(&xs)` | `Find(ctx, bson.D{})`, then `cursor.All(ctx, &xs)` |
| Read one | `FindId(oid).One(&p)`, `mgo.ErrNotFound` | `FindOne(ctx, filter).Decode(&p)`, `mongo.ErrNoDocuments` |
| Update | `UpdateId(oid, p)` | `ReplaceOne(ctx, filter, p)` |
| Delete | `RemoveId(oid)` | `DeleteOne(ctx, filter)` |

Two differences matter more than the renames. The first is the connection model: in 2017 every request fetched a session and had to release it, a step that my first two parts forgot and the third one added as `FinishSession`. The driver's `Client` is a pool of connections and is safe for concurrent use by multiple goroutines, so a process creates **exactly one `Client` at startup** and passes it around. The second is the context: every operation takes a `context.Context`, and the handlers below hand it the request's own, which is where a per-request deadline would attach.

If you are coming from driver v1 and not from mgo, the visible change is that `mongo.Connect` no longer takes a context, and that `ObjectID` moved from `bson/primitive` into `bson`.

## Routing with ServeMux patterns

Go 1.22 moved two things I used `gorilla/mux` for in 2017 into the standard library: **matching on the HTTP method and capturing path segments**. A pattern is now `"METHOD /path/{name}"`, and the handler reads the captured value with `r.PathValue("name")`.

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Product struct {
	ID   bson.ObjectID `json:"id" bson:"_id"`
	Name string        `json:"name" bson:"name"`
}

type api struct {
	products *mongo.Collection
}

func (a *api) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /products", a.create)
	mux.HandleFunc("GET /products", a.list)
	mux.HandleFunc("GET /products/{id}", a.get)
	mux.HandleFunc("PUT /products/{id}", a.replace)
	mux.HandleFunc("DELETE /products/{id}", a.remove)
	return mux
}
```

Registering the five routes is the whole router. The rest of its behaviour comes from the standard library:

- A path that matches with the wrong method gets `405 Method Not Allowed` and an `Allow` header listing the methods that would have worked. A `PATCH` to `/products/{id}` below returned `Allow: DELETE, GET, HEAD, PUT`, because a `GET` pattern also matches `HEAD`.
- When two patterns overlap, the more specific one wins, so `/products/latest` could sit next to `/products/{id}`. When neither is more specific, registration panics at startup, not at the first request.
- The old behaviour returns under `GODEBUG=httpmuxgo121=1`, where braces are literal again.

That is enough for a CRUD API. `gorilla/mux` still offers regular-expression constraints on variables and URL building from named routes, which `ServeMux` does not. If your routes use neither, `ServeMux` saves a dependency, and if they do, keeping `gorilla/mux` is a sound choice.

## Handlers

The original handlers were a three-part series: [part 1 (POST)](https://dawidrylko.com/http-methods-z-go-i-mongodb-czesc-1-post/) (in Polish) for creating a product, [part 2 (GET)](https://dawidrylko.com/http-methods-z-go-i-mongodb-czesc-2-get/) (in Polish) for the list and a single product, and [part 3 (PUT and DELETE)](https://dawidrylko.com/http-methods-z-go-i-mongodb-czesc-3-put-i-delete/) (in Polish). Their weak spots decided what changed here. The 2017 code ignored the error from `Decode`, answered 404 for every database error (which also hides a dead database), and in part 2 passed the path parameter straight to `bson.ObjectIdHex`. The doc comment of that function says that an invalid hex string causes a runtime panic, and part 3 later added the `IsObjectIdHex` guard to update and remove, but not to the GET handler.

In the new version an invalid ID is a `400`, **a missing document is the only `404`**, and anything else is a logged `500`:

```go
func (a *api) create(w http.ResponseWriter, r *http.Request) {
	var in Product
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil || in.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}
	in.ID = bson.NewObjectID()
	if _, err := a.products.InsertOne(r.Context(), in); err != nil {
		serverError(w, err)
		return
	}
	w.Header().Set("Location", "/products/"+in.ID.Hex())
	writeJSON(w, http.StatusCreated, in)
}

func (a *api) list(w http.ResponseWriter, r *http.Request) {
	cur, err := a.products.Find(r.Context(), bson.D{})
	if err != nil {
		serverError(w, err)
		return
	}
	out := []Product{}
	if err := cur.All(r.Context(), &out); err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (a *api) get(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	var p Product
	err = a.products.FindOne(r.Context(), bson.D{{Key: "_id", Value: id}}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}
```

`ReplaceOne` fits `PUT`, because the method replaces the whole representation. The match count tells a replaced document from a missing one, and `DeleteOne` reports the same through `DeletedCount`:

```go
func (a *api) replace(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	var in Product
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil || in.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}
	in.ID = id
	res, err := a.products.ReplaceOne(r.Context(), bson.D{{Key: "_id", Value: id}}, in)
	if err != nil {
		serverError(w, err)
		return
	}
	if res.MatchedCount == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusOK, in)
}

func (a *api) remove(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	res, err := a.products.DeleteOne(r.Context(), bson.D{{Key: "_id", Value: id}})
	if err != nil {
		serverError(w, err)
		return
	}
	if res.DeletedCount == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
```

Every handler shares two small helpers. `list` starts from an empty slice, so an empty collection encodes as `[]` and not as `null`.

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func serverError(w http.ResponseWriter, err error) {
	log.Printf("request failed: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
}
```

## CORS and the preflight request

A browser sends a preflight `OPTIONS` request before any cross-origin request that is not "simple". A `POST` with `Content-Type: application/json` is not simple, because simple requests are limited to `GET`, `HEAD` and `POST` with a handful of content types, so every JSON client on another origin triggers a preflight. The browser puts the `Origin`, `Access-Control-Request-Method` and `Access-Control-Request-Headers` headers on it and expects a response with the matching `Access-Control-Allow-*` headers. MDN's example answers with `204 No Content`.

That is what failed in 2017. A form served from `localhost:4200` sent its data to my API on port 8001, the router had no `OPTIONS` route and the browser reported a preflight that "doesn't pass access control check". The status changed from 404 to 403 once `gorilla/handlers` was in, and the `POST` went through with `201 Created` after I allowed the `Content-Type` header and the origin. I wrote that story up in [Go Programming Language - CORS - gorilla/handlers](https://dawidrylko.com/go-programming-language-cors-gorilla-handlers/) (in Polish).

With `ServeMux` the same request gets a `405`, because only the other methods are registered for that path. The fix is the same, and it belongs in front of the router:

```go
func cors(allowed map[string]bool, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Origin")
		origin := r.Header.Get("Origin")
		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
				w.Header().Set("Access-Control-Max-Age", "600")
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
```

Three decisions sit in those few lines. The first is an allowlist in place of `*`. In 2017 I allowed every origin, which works for a public API without credentials, but MDN states that a credentialed request must not get the wildcard in `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods` or `Access-Control-Expose-Headers`, so **the allowlist is the version that keeps working once credentials enter the picture**.

The second is that `Vary: Origin` is always set. When the server echoes one origin out of an allowlist, MDN says the response should also carry `Origin` in `Vary`, so that caches know the response varies with the origin of the request.

The third is that a preflight from an unknown origin falls through to the router. It gets the `405` and no `Access-Control-Allow-Origin`, and the browser blocks the call.

CORS tells a browser whether it may expose a response to a page. It does not authenticate anything, and `curl` ignores it. The standard library has a nearby feature that is easy to confuse with it: Go 1.25 added `http.CrossOriginProtection`, which rejects non-safe cross-origin browser requests using Fetch metadata. That is CSRF protection and answers a different question.

If you would rather not own these 20 lines, `gorilla/handlers` v1.5.2 still ships `handlers.CORS`, and `rs/cors` is a dedicated package for the job (latest tag v1.11.1, August 2024).

## Wiring and a run against a real server

`main` connects once, pings the server before listening, and shuts down on Ctrl+C:

```go
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := client.Ping(pingCtx, nil); err != nil {
		log.Fatal(err)
	}

	a := &api{products: client.Database("shopping-manager").Collection("products")}
	srv := &http.Server{
		Addr:              ":8001",
		Handler:           cors(map[string]bool{"http://localhost:4200": true}, a.routes()),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(shutdownCtx)
	}()

	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
```

`ReadHeaderTimeout` is there because **`http.ListenAndServe` builds a `Server` with every timeout at zero**, which means no limit, and that is the server my 2017 code ran. The module needs `go get go.mongodb.org/mongo-driver/v2@v2.9.3`. With `MONGODB_URI` pointing at a server, `go run .` serves on port 8001. This is the output of the sequence below against MongoDB 8.0.34:

```bash
curl -si -XPOST -H 'Content-Type: application/json' -d '{"name":"Szynka"}' localhost:8001/products
# HTTP/1.1 201 Created
# Location: /products/6aeb1f275aacffe7339f5e5a
# {"id":"6aeb1f275aacffe7339f5e5a","name":"Szynka"}

curl -s -w ' [%{http_code}]\n' localhost:8001/products/xyz
# {"error":"invalid id"} [400]

curl -s -w ' [%{http_code}]\n' localhost:8001/products/000000000000000000000000
# {"error":"not found"} [404]

curl -si -XPATCH localhost:8001/products/6aeb1f275aacffe7339f5e5a
# HTTP/1.1 405 Method Not Allowed
# Allow: DELETE, GET, HEAD, PUT

curl -si -XOPTIONS -H 'Origin: http://localhost:4200' \
  -H 'Access-Control-Request-Method: POST' localhost:8001/products
# HTTP/1.1 204 No Content
# Access-Control-Allow-Headers: Content-Type
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE
# Access-Control-Allow-Origin: http://localhost:4200
# Access-Control-Max-Age: 600
# Vary: Origin

curl -si -XOPTIONS -H 'Origin: http://evil.example' \
  -H 'Access-Control-Request-Method: POST' localhost:8001/products
# HTTP/1.1 405 Method Not Allowed
# Allow: GET, HEAD, POST
```

(My 2017 post used `Szynka z 9 marca` as the test product, so the ham stayed.) What the list endpoint still lacks is any bound: `Find` with an empty filter returns the whole collection, and a real service needs pagination, indexes for its queries and authentication before it leaves localhost.

## Sources

1. The Go Blog, [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements): method patterns, wildcards, `PathValue`, precedence, `405` with the `Allow` header, `httpmuxgo121`.
2. The Go Project, [Go 1.25 Release Notes](https://go.dev/doc/go1.25): `http.CrossOriginProtection` as CSRF protection based on Fetch metadata.
3. The Go Project, [`net/http/server.go` at go1.27.3](https://github.com/golang/go/blob/go1.27.3/src/net/http/server.go): `ListenAndServe` creates a `Server` with only `Addr` and `Handler`; no `ReadHeaderTimeout` means no timeout.
4. MongoDB, [mongo-go-driver README](https://github.com/mongodb/mongo-go-driver): v2 import path, Go 1.25 or newer, MongoDB 4.4 or newer.
5. Go module proxy, [mongo-driver/v2 latest version](https://proxy.golang.org/go.mongodb.org/mongo-driver/v2/@latest): v2.9.3 at the time of writing. Same proxy, [mongo-driver v1 latest version](https://proxy.golang.org/go.mongodb.org/mongo-driver/@latest): v1.17.10, September 2026.
6. MongoDB, [Go driver v2.0 migration guide](https://github.com/mongodb/mongo-go-driver/blob/master/docs/migration-2.0.md): `Connect` without a context parameter.
7. MongoDB, [mongo-go-driver v2.9.3, `mongo/client.go`](https://github.com/mongodb/mongo-go-driver/blob/v2.9.3/mongo/client.go): the `Client` as a connection pool safe for concurrent use.
8. go-mgo/mgo, [README on branch v2-unstable](https://github.com/go-mgo/mgo/blob/v2-unstable/README.md): "THIS IS UNMAINTAINED" and the pointer to the fork. globalsign/mgo, [README](https://github.com/globalsign/mgo/blob/master/README.md): MongoDB 3.0 to 3.6 tested, 4.0 experimental.
9. go-mgo/mgo, [`bson/bson.go`](https://github.com/go-mgo/mgo/blob/v2-unstable/bson/bson.go): the doc comment of `ObjectIdHex` on the panic for invalid input.
10. Gorilla, [New Maintainers Announcement](https://github.com/orgs/gorilla/discussions/9), 19 July 2023: a new group of core maintainers.
11. Go module proxy, [gorilla/mux latest version](https://proxy.golang.org/github.com/gorilla/mux/@latest) (v1.8.1) and [gorilla/handlers latest version](https://proxy.golang.org/github.com/gorilla/handlers/@latest) (v1.5.2), both October 2023, and [rs/cors latest version](https://proxy.golang.org/github.com/rs/cors/@latest) (v1.11.1, August 2024). gorilla/handlers, [`cors.go` at v1.5.2](https://github.com/gorilla/handlers/blob/v1.5.2/cors.go).
12. MDN Web Docs, [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): simple requests, preflight headers, the `204` example, `Vary: Origin`, wildcard limits for credentialed requests.
13. MongoDB, [Community Server downloads feed](https://downloads.mongodb.org/current.json): release 8.0.34.
