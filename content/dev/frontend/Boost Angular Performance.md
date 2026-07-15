---
date: 2024-07-20
tags:
  - dev
  - frontend
---

## 🌐 Overview

Optimizing #Angular components is crucial for ensuring smooth performance, especially when dealing with large datasets or complex user interfaces. Below are several proven optimization techniques supported by documentation and blog posts, along with an addition focusing on Angular Signals.

## 📝 Techniques

### 1️⃣ Change Detection Strategy `OnPush`

The default change detection strategy in Angular is `Default`, which means Angular checks for changes in all components at every change detection cycle. You can improve performance by setting the change detection strategy to `OnPush`, which only checks for changes when the component's inputs change.

```typescript
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: "app-example",
  templateUrl: "./example.component.html",
  styleUrls: ["./example.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  @Input() data: any;
}
```

**Documentation:** [Using OnPush](https://angular.dev/best-practices/skipping-subtrees#using-onpush)

### 2️⃣ Using `trackBy` in `*ngFor`

When Angular renders lists with `*ngFor`, it compares all items to detect changes by default. You can improve performance by providing a `trackBy` function that identifies items based on unique identifiers.

```html
<div *ngFor="let item of items; trackBy: trackByFn">{{ item.name }}</div>
```

```typescript
trackByFn(index: number, item: any): number {
  return item.id; // Unique identifier for the items
}
```

**Documentation:** [Tracking items with \*ngFor trackBy](https://angular.dev/guide/directives#tracking-items-with-ngfor-trackby)

### 3️⃣ Lazy Loading Modules

Lazy loading modules allows you to load parts of your application only when they are needed, reducing the initial load time of your application.

```typescript
const routes: Routes = [
  {
    path: "feature",
    loadChildren: () =>
      import("./feature/feature.module").then((m) => m.FeatureModule),
  },
];
```

**Documentation:** [Lazy Loading Modules](https://angular.dev/guide/ngmodules/lazy-loading)

### 4️⃣ Virtual Scrolling

Virtual scrolling renders only the visible items in a list, which is particularly useful when working with large datasets.

```html
<cdk-virtual-scroll-viewport itemSize="50" class="example-viewport">
  <div *cdkVirtualFor="let item of items">{{item.name}}</div>
</cdk-virtual-scroll-viewport>
```

**Documentation:** [Virtual Scrolling](https://material.angular.io/cdk/scrolling/overview)

### 5️⃣ Asynchronous Operations with `async` Pipe

Using the `async` pipe for handling data streams automatically manages subscriptions and unsubscriptions, which can prevent memory leaks.

```html
<div *ngIf="data$ | async as data">{{ data | json }}</div>
```

**Documentation:** [Async Pipe](https://angular.dev/api/common/AsyncPipe)

### 6️⃣ Using `NgZone` to Optimize Rendering

Use `NgZone` to perform some operations outside of Angular's change detection context, which can prevent excessive change detection cycles.

```typescript
import { Component, NgZone, AfterViewInit } from "@angular/core";

@Component({
  selector: "app-example",
  templateUrl: "./example.component.html",
  styleUrls: ["./example.component.css"],
})
export class ExampleComponent implements AfterViewInit {
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          // Operations that require Angular context
        });
      });
    });
  }
}
```

**Documentation:** [NgZone](https://angular.dev/api/core/NgZone)

### 7️⃣ AOT Compilation

Ahead-of-Time (AOT) compilation is a powerful feature that can reduce the size of your application and improve its performance by compiling your Angular components and templates during the build process, rather than at runtime.

To enable AOT compilation, add the following flag to your Angular build command:

```bash
ng build --aot
```

**Documentation:** [Angular AOT Compilation](https://angular.io/guide/aot-compiler)

### 8️⃣ Preloading Modules

Preloading modules can improve the user experience by loading modules in the background after the application has been initially loaded. This can be achieved using the `PreloadAllModules` strategy.

```typescript
import { RouterModule, Routes, PreloadAllModules } from "@angular/router";

const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./home/home.module").then((m) => m.HomeModule),
  },
  {
    path: "about",
    loadChildren: () =>
      import("./about/about.module").then((m) => m.AboutModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

**Documentation:** [PreloadAllModules](https://angular.dev/api/router/PreloadAllModules)

### 9️⃣ Minimizing Component Re-renders

Avoid unnecessary component re-renders by ensuring that you only pass immutable data to your components or use pure pipes. Immutable data ensures that Angular can quickly determine if changes have occurred, and pure pipes allow Angular to optimize pipe executions.

```typescript
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "purePipe",
  pure: true,
})
export class PurePipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    // transformation logic
  }
}
```

**Documentation:** [Understanding Pipes](https://angular.dev/guide/pipes)

### 🔟 Angular Signals

Angular Signals provide a reactive programming model that allows you to manage state more efficiently. Signals can be used to create reactive data sources that automatically notify Angular when changes occur, minimizing the need for manual change detection and improving performance.

#### Creating a Signal

You can create a signal using the `signal` function:

```typescript
import { signal } from "@angular/core";

const count = signal(0);
```

#### Using Signals in Components

Signals can be used directly in components to react to changes in state:

```typescript
import { Component, computed, signal } from "@angular/core";

@Component({
  selector: "app-counter",
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.set(this.count() + 1);
  }
}
```

#### Reactive Computed Values

You can also create computed signals that automatically update when their dependencies change:

```typescript
import { computed, signal } from "@angular/core";

const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() => `${firstName()} ${lastName()}`);
```

#### Watching Signals

Use the `effect` function to react to changes in signals:

```typescript
import { effect, signal } from "@angular/core";

const count = signal(0);

effect(() => {
  console.log(`Count changed: ${count()}`);
});
```

**Documentation:** [Angular Signals](https://angular.dev/guide/signals)

## 💁🏼‍♀️ Summary

Optimizing Angular components involves applying various strategies and tools depending on the application's context. Implementing `OnPush` change detection, using `trackBy`, lazy loading, virtual scrolling, asynchronous operations, managing zones with `NgZone`, and utilizing Angular Signals can significantly enhance performance. Additionally, leveraging AOT compilation, preloading modules, and minimizing component re-renders further boosts the application's efficiency.

Applying these techniques will not only improve performance but also make your application more responsive and user-friendly.
