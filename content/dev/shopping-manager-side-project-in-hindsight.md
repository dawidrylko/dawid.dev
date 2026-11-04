---
title: "Shopping Manager in hindsight: a ten-week side project"
date: 2026-11-04
description: "A 2017 blogging challenge yielded five Go product endpoints and an Angular client; recipes, menus and budget stayed on paper. What I would change in 2026."
tags:
  - dev
  - go
  - angular
---

> [!tldr]
> In 2017 I entered a Polish challenge to build a side project in public for ten weeks. It shipped five product endpoints in Go and a product list and form in Angular. The recipes, menus and budget that made it a product stayed on paper, inside a data model with flaws the first real query would have exposed. A deadline counted in posts rewards tutorials, so today I would build one vertical slice first and the riskiest algorithm before any CRUD.

A challenge that counts posts gets posts. What it does to the product is still visible in the repositories, which say exactly where the spring of 2017 went.

## The challenge and the plan

In March 2017 I entered _Daj Się Poznać_, a Polish challenge for programmers who blog. My plan, written in the [first post of the series](https://dawidrylko.com/daj-sie-poznac-2017-z-czym-to-sie-je/) (in Polish), was ten weeks, at least 20 posts and a busier GitHub profile. The real goal was learning: Angular 2 with TypeScript on the frontend, and Go on the backend, a language I had never used. The project itself was officially secondary. If anything worked after ten weeks, I would be happy.

The organiser's numbers, which I quoted in the [closing post](https://dawidrylko.com/daj-sie-poznac-2017-podsumowanie/) (in Polish): 981 participants, almost 8000 posts, 183 people in the final stage. My own archive for that window holds 22 posts. Four of them are about chatbots, because a second project took over my attention in April.

## The idea: a grocery budget with a data model

The app was **Shopping Manager**, and the [mockup post](https://dawidrylko.com/shopping-manager-mockup/) (in Polish) describes three pillars:

- Products: add, browse, mark favourites, record a price and watch how it changes over time.
- Recipes: built from products, with the energy value of a meal computed from them.
- Planning: set a weekly budget and a household size, get recipes matched to both and a shopping list, and carry long-life leftovers into the next week.

Every feature carried an `[MVP]` or `[V2]` tag. Shop-specific prices from an external database were V2. The interface was a dashboard with the current budget, plus tabs for budget, products and recipes.

The planning section is two short paragraphs in that mockup, and it holds the only hard problem in the project: choosing recipes under a budget. The rest is forms and tables.

## The data model

A [second design post](https://dawidrylko.com/shopping-manager-jadlospis-produkt-przepis/) (in Polish) fixed the shape, in Go structs on top of MongoDB:

| Entity | Fields | What it implies |
| --- | --- | --- |
| Menu | id, date, recipes | A day is a list of recipes, embedded in full |
| Recipe | id, name, description, ingredients | The method is one plain string, a deliberate simplification |
| Ingredient | product, unit of measure, quantity | A new entity, because a recipe needs an amount, not just a product |
| Product | id, name, manufacturer, EAN, energy, net weight, unit, prices | The core of the system, with a price history |

The chain reads naturally: a menu holds recipes, a recipe holds ingredients, an ingredient points at a product. It also contains five defects, each visible in the committed code.

Money is a `float32`. The price history is a slice of `Price{Date, Value}` with the value as a 32-bit float. Binary floats cannot represent most decimal prices exactly, so the model should keep an integer number of grosze (or cents) plus a currency.

Energy and net weight are strings. The feature "energy value of a meal, computed from its products" needs arithmetic, and arithmetic needs numbers with a unit.

The menu embeds recipes by value. That is correct if a menu should be a snapshot of what was cooked, and wrong if it should follow later edits to a recipe. The design never chose. MongoDB's own modelling guidance says to reference when the child can exist without its parent, and recipes and products both can.

The price history grows inside the product document. One array, appended on every update. With per-shop prices from V2 it multiplies. An unbounded array is the textbook trigger for moving the children into their own collection.

**The contract was never written down.** The Angular form builds a product with `price: 3.59`, a scalar. The Go model expects `Prices`, an array of dated values, and the handler discards the error returned by `Decode`. The two sides disagree about what a price is, and nothing fails loudly. In the same codebase `Description` carries the JSON tag `name`, the same as `Name`. According to the `encoding/json` documentation, fields that conflict on a name at the same level are all ignored, without an error, so a recipe would serialize with neither.

## What shipped

I ended the series with a skeleton of the app, a few endpoints and, in my words, several volumes of documentation read. The repositories ([API](https://github.com/dawidrylko/shopping-manager-api), [web](https://github.com/dawidrylko/shopping-manager-web)) match that description. Their last commits are from 6 May 2017.

| Part of the plan | State at the end |
| --- | --- |
| Products: create, list, read, update, delete | Five endpoints in Go on MongoDB through `mgo.v2`, with CORS from `gorilla/handlers` |
| Product screens | An Angular list with filter and paging, and a form |
| Price history | A field in the model, a scalar in the form |
| Recipes and menus | Struct definitions only. The recipe model imports an `ingredient` package that was never committed, and nothing imports recipe or menu |
| Budget and dashboard | The dashboard route renders the generator's placeholder text, "dashboard works!" |
| Deployment | The Angular app on Heroku behind a small Express server, after a migration from Angular 2 to 4 |
| Repository layout | One repository split into `api` and `web` with git submodules, forced by the moment the app had to leave `localhost` |

The whole backend is about 290 lines of Go in six files. The shipped half is the half that is easy to write about: a REST handler, a driver call, a form, a deployment. Each of those became a tutorial post, and the posts were what the challenge counted.

## What I would do differently in 2026

**Risk first.** I would spend the first week on the planner, before a single list screen. Choosing the cheapest set of foods that meets nutritional constraints is the old _diet problem_ from linear programming. George Stigler posed it in the 1940s, and Google's OR-Tools documentation walks through it as a model with 77 foods and 9 nutrient constraints. A weekly menu adds whole portions and a household size, which makes it an integer program ([[linear-programming-with-google-or-tools|a small LP in OR-Tools]] shows the modelling). That is a few hundred lines around a solver, not an afternoon of handlers, and the result decides whether the app is worth finishing.

One vertical slice. "Generate a shopping list from three recipes" touches every layer and has value alone. "Product CRUD" has value to nobody.

Money and quantities as numbers with units from the first commit, and a written API contract before the first form. The scalar-versus-array bug is what a missing contract looks like.

A newer stack with fewer parts, walked through in [[rest-api-in-go-and-mongodb-from-mgo-to-driver-v2|REST API in Go and MongoDB]]. The `mgo` driver I used is now marked unmaintained in its own README, and the official driver is at v2 under `go.mongodb.org/mongo-driver/v2`. Since Go 1.22 the standard `ServeMux` matches methods and path wildcards, which covers what a router package did here:

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /product/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	_ = id
})
```

On the Angular side, components are standalone by default since version 19, so the module files for `product`, `page` and `ui` would not exist.

Product data from outside. The mockup already planned an external product database for V2. [Open Food Facts](https://world.openfoodfacts.org/) offers a lookup by barcode, which fits the EAN field I had modelled. Its documentation asks for a custom `User-Agent` and limits product reads to 15 per minute per IP. The data is under the Open Database License, so reuse comes with attribution and share-alike duties that deserve reading before the first import.

A coding assistant for the boilerplate. Five handlers and two Angular screens are the part current assistants write well, which moves the bottleneck. The unbuilt half of my plan was a scoping problem.

## What the challenge did give me

It gave me what I asked for. Go turned out to be a pleasure for a backend, Angular 2 stopped being something to be sceptical about, and writing code and posts side by side turned out to be tiring, and still something I recommended to anyone in the closing post. The posts from that spring are still readable as a trail of decisions, including the wrong ones.

What it did not give me was a product, and the plan had said that was acceptable. **If the goal is learning, count what you learned. If the goal is a product, put the hardest part of the product on the schedule first.**

## Sources

1. Shopping Manager API, [dawidrylko/shopping-manager-api](https://github.com/dawidrylko/shopping-manager-api): `main.go`, `resources/` and `server/`, last commit on 6 May 2017.
2. Shopping Manager web, [dawidrylko/shopping-manager-web](https://github.com/dawidrylko/shopping-manager-web): the `src/app/product` module, the dashboard component and `server.js`.
3. MongoDB Documentation, [Embedding vs. References](https://www.mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references/): when to embed and when to reference.
4. Go documentation, [`encoding/json`](https://pkg.go.dev/encoding/json): the rule for struct fields whose JSON names conflict.
5. Google OR-Tools, [The Stigler diet](https://developers.google.com/optimization/lp/stigler_diet): the diet problem as a linear program.
6. mgo, [README of go-mgo/mgo](https://github.com/go-mgo/mgo): the unmaintained notice.
7. MongoDB, [mongo-go-driver](https://github.com/mongodb/mongo-go-driver): the v2 module path.
8. The Go Blog, [Routing Enhancements for Go 1.22](https://go.dev/blog/routing-enhancements): method and wildcard patterns in `ServeMux`.
9. Angular documentation, [Components](https://angular.dev/guide/components): standalone as the default from version 19.
10. Open Food Facts, [API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/): product lookup by barcode, rate limits, licence.
