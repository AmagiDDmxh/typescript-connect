import { string } from "../node_modules/_@types_yargs@15.0.5@@types/yargs/index";

interface Action<T> {
  payload?: T;
  type: string;
}

class EffectModule {
  count = 1;
  message = "hello!";

  delay(input: Promise<number>) {
    return input.then(i => ({
      payload: `hello ${i}!`,
      type: 'delay'
    }));
  }

  setMessage(action: Action<Date>) {
    return {
      payload: action.payload!.getMilliseconds(),
      type: "set-message"
    };
  }
}

// 修改 Connect 的类型，让 connected 的类型变成预期的类型
// Find this on https://jkchao.github.io/typescript-book-chinese/tips/infer.html
// type FuncName<T> = { [P in keyof T]: T[P] extends Function ? P : never}[keyof T]
type ExtractAnd<T, U, O> = Extract<T, U> extends never ? never : O
type FuncName<T> = { [P in keyof T]: ExtractAnd<T[P], Function, P>}[keyof T]

type AsyncMethod<T, U> = (input: Promise<T>) => Promise<Action<U>>
type SyncMethod<T, U> = (input: Action<T>) => Action<U>

type UnaryFunction<I, O> = (input: I) => O
type ConnectMethod<T, P> = UnaryFunction<T, Action<P>>
type ConnectMethods<T> = 
  T extends AsyncMethod<infer I, infer O> | SyncMethod<infer I, infer O>
    ? ConnectMethod<I, O>
    : unknown

/* 
1: Filter out to get the function and assign it to the keyof object
2: Value type should be consider one of two Func type
  2.1: Both of them take T and U generic or its input and output type
  2.2: One call AsyncMethod, Which should take a Promise as an input, 
      returns an Promise<Action<U>> of type U
  2.3: SyncMethod do the same except take an Action as an input and output an Action
3: Base on the Func types given above, 
  3.1: Unpromise the AsyncMethod
  3.2: UnAction the SyncMethod
  3.3: Both should return an Action
*/
type Connect = (module: EffectModule) => { 
  [K in FuncName<EffectModule>]: ConnectMethods<EffectModule[K]>
};

const connect: Connect = m => ({
  delay: (input: number) => ({
    type: 'delay',
    payload: `hello 2`
  }),
  setMessage: (input: Date) => ({
    type: "set-message",
    payload: input.getMilliseconds()
  })
});

type Connected = {
  delay(input: number): Action<string>;
  setMessage(action: Date): Action<number>;
};

export const connected: Connected = connect(new EffectModule());
