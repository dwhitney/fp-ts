import * as stateT from 'fp-ts/lib/StateT'
import { TaskEither, taskEither } from 'fp-ts/lib/TaskEither'
import { Monad3 } from 'fp-ts/lib/Monad'
import { Endomorphism, tuple } from 'fp-ts/lib/function'
import { Either } from 'fp-ts/lib/Either'

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    StateTaskEither: StateTaskEither<U, L, A>
  }
}

const stateTIO = stateT.getStateT(taskEither)

export const URI = 'StateTaskEither'

export type URI = typeof URI

export class StateTaskEither<S, L, A> {
  // prettier-ignore
  readonly '_A': A
  // prettier-ignore
  readonly '_L': L
  // prettier-ignore
  readonly '_U': S
  // prettier-ignore
  readonly '_URI': URI
  constructor(readonly value: (s: S) => TaskEither<L, [A, S]>) {}
  run(s: S): Promise<Either<L, [A, S]>> {
    return this.value(s).run()
  }
  eval(s: S): Promise<Either<L, A>> {
    return this.run(s).then(e => e.map(([a]) => a))
  }
  exec(s: S): Promise<Either<L, S>> {
    return this.run(s).then(e => e.map(([_, s]) => s))
  }
  map<B>(f: (a: A) => B): StateTaskEither<S, L, B> {
    return new StateTaskEither(stateTIO.map(f, this.value))
  }
  ap<B>(fab: StateTaskEither<S, L, (a: A) => B>): StateTaskEither<S, L, B> {
    return new StateTaskEither(stateTIO.ap(fab.value, this.value))
  }
  ap_<B, C>(this: StateTaskEither<S, L, (b: B) => C>, fb: StateTaskEither<S, L, B>): StateTaskEither<S, L, C> {
    return fb.ap(this)
  }
  chain<B>(f: (a: A) => StateTaskEither<S, L, B>): StateTaskEither<S, L, B> {
    return new StateTaskEither(stateTIO.chain(a => f(a).value, this.value))
  }
  orElse<M>(f: (l: L) => StateTaskEither<S, M, A>): StateTaskEither<S, M, A> {
    return new StateTaskEither(s => this.value(s).orElse(l => f(l).value(s)))
  }
}

const map = <S, L, A, B>(fa: StateTaskEither<S, L, A>, f: (a: A) => B): StateTaskEither<S, L, B> => {
  return fa.map(f)
}

const of = <S, L, A>(a: A): StateTaskEither<S, L, A> => {
  return new StateTaskEither(stateTIO.of(a))
}

const ap = <S, L, A, B>(
  fab: StateTaskEither<S, L, (a: A) => B>,
  fa: StateTaskEither<S, L, A>
): StateTaskEither<S, L, B> => {
  return fa.ap(fab)
}

const chain = <S, L, A, B>(
  fa: StateTaskEither<S, L, A>,
  f: (a: A) => StateTaskEither<S, L, B>
): StateTaskEither<S, L, B> => {
  return fa.chain(f)
}

const stateTget = stateT.get(taskEither)
export const get = <L, S>(): StateTaskEither<S, L, S> => {
  return new StateTaskEither<S, L, S>(stateTget())
}

const stateTput = stateT.put(taskEither)
export const put = <L, S>(s: S): StateTaskEither<S, L, void> => {
  return new StateTaskEither<S, L, void>(stateTput(s))
}

const stateTmodify = stateT.modify(taskEither)
export const modify = <L, S>(f: Endomorphism<S>): StateTaskEither<S, L, void> => {
  return new StateTaskEither<S, L, void>(stateTmodify(f))
}

const stateTgets = stateT.gets(taskEither)
export const gets = <S, L, A>(f: (s: S) => A): StateTaskEither<S, L, A> => {
  return new StateTaskEither<S, L, A>(stateTgets(f))
}

export const fromTaskEither = <S, L, A>(fa: TaskEither<L, A>): StateTaskEither<S, L, A> => {
  return new StateTaskEither(s => fa.map(a => tuple(a, s)))
}

export const stateTaskEither: Monad3<URI> = {
  URI,
  map,
  of,
  ap,
  chain
}
