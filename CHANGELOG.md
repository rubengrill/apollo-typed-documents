# 1.0.0

- Improve docs
- Add `create-react-app` examples
- Support GraphQL interfaces
- Support GraphQL union types
- Support fragments and inline fragments
- Support `__typename` selection
- Support alias in selections
- Support custom scalar types
- Support errors
- Add typed version of `useSubscription`

Backward incompatible change:

To support errors, the argument `data` changed to `result` which can contain both `data` and `errors`:

```js
// old
apolloMock(documentNode, variables, { authors: [] });

// new
apolloMock(documentNode, variables, { data: { authors: [] } });
```
