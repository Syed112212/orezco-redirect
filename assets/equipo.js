/* == Filnet CRM - quien puede entrar ============================
   Lista cerrada: solo estas cinco personas entran. Quien no este aqui
   no aparece siquiera en el desplegable, y no hay ninguna pantalla para
   darse de alta.

   ⚠️ CONTRASENA TEMPORAL. Los cinco tienen la misma de momento, y esta
   dicha en abierto para que podais entrar hoy. CAMBIALA: sirve el
   proyecto en local, abre pruebas/credenciales.html, pon una contrasena
   por persona, descarga el fichero y sustituye este.

   No hay ninguna contrasena guardada aqui: por persona hay una sal
   aleatoria y PBKDF2-SHA256 con 250.000 vueltas.
   =============================================================== */
window.FILNET_ACCESOS = {
  carlos: { sal: "21a30ab787c799f5bb339bc818f4e68a",
    hash: "edfe8228c1e1dbe95d2f9ce956d7fa49661a86d1a0214e2ba0d6ca5964d3ab0c" },
  syed: { sal: "6654c1f15727823470dca87fbd744f32",
    hash: "a170257ac55c385499113879ffe24f25f02775864525a54d6d94ed1e77d21f39" },
  victor: { sal: "1b8af3f4b49549837d8054f213c19d4a",
    hash: "6535c84f91680da74219eaba750edad9b9641c894e25d6c75e28a776548fff68" },
  ramon: { sal: "deef7667a9b5bde917eac3b26bcfe7ea",
    hash: "9f34808fe4eace07b1cc54a631f938d51d96cbc5c57fa578190f12cb34b59ca8" },
  arnau: { sal: "38f46c71e767692f95724f6d3ef142be",
    hash: "a8f7bd12afb19745cb70f5946e7b321b1ee98be1ed5fc39ce22c360866e80921" }
};
