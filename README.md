# react-observable-state-hooks

## install

```
npm install --save @reismannnr2/react-observable-state-hooks
```

## example

```tsx
import { ObservableState } from '@reismannnr2/observable-state';
import { useChildState$, useCurrentState } from '@reismannnr2/observable-state-hooks';

const ChildComponent = (props) => {
  const text$ = props.text$;
  const [text] = useCurrentState(text$);
  return <button onClick={() => { text$.update('updated') }}>{text}</button>
}
const ParentComponent = () => {
  const state$ = useMemo(() => new ObservableState({ text: 'button', numbers: [1, 2, 3] }), [])
  return <ChildComponent text$={useChildState$(state$, 'text')} />
}
```
