declare module '*firebase-config.js' {
  // arquivo legado ESM; tipagem mínima só para satisfazer o TS.
  export const firebaseConfig: unknown
}

declare module '*firebase-db.js' {
  // arquivo legado ESM; executa side-effects e popula `window.*`.
  const _unused: unknown
  export default _unused
}

