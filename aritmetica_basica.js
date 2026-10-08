// ===== CONFIGURACIÓN =====
const CLAVE = "aritmeticaBasica"; // clave con la que se guarda en localStorage
const SIMBOLOS = { "+": "+", "-": "−", "*": "×", "/": "÷" }; // cómo se muestra cada operación
// "actual" es el número en pantalla (texto); "previo" y "operador" son la operación pendiente
// "nuevo" es true cuando la próxima cifra debe empezar un número nuevo
const ORIGINAL = { actual: "0", previo: null, operador: null, nuevo: true, error: "", historial: [] };
let estado = { ...ORIGINAL }; // copia de los valores originales
const $ = (id) => document.getElementById(id); // atajo para buscar elementos por id
const texto = (n) => String(n).replace(".", ","); // muestra la coma decimal
// ===== LOCALSTORAGE =====
// Guarda el estado completo como texto JSON
function guardar() { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
// Recupera lo guardado (si existe); mezclar con ORIGINAL evita que falte algún dato
function cargar() { const g = localStorage.getItem(CLAVE); if (g) estado = { ...ORIGINAL, ...JSON.parse(g) }; }
// ===== PANTALLA =====
// Dibuja el número, la operación pendiente, el historial y resalta la operación activa
function pintar() {
    $("resultado").textContent = texto(estado.actual);
    $("expresion").textContent = estado.error || (estado.operador ? texto(estado.previo) + " " + SIMBOLOS[estado.operador] : "");
    $("historial").innerHTML = "";
    estado.historial.forEach((linea) => { const li = document.createElement("li"); li.textContent = linea; $("historial").appendChild(li); });
    document.querySelectorAll(".op").forEach((b) => b.classList.toggle("activo", estado.nuevo && b.dataset.valor === estado.operador));
}
// ===== OPERACIONES =====
// Calcula a (operador) b; devuelve un número o un texto de error
function resolver() {
    const a = estado.previo, b = Number(estado.actual), op = estado.operador;
    if (op === "/" && b === 0) return "No se puede dividir entre 0";
    const r = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b;
    const limpio = Math.round(r * 1e10) / 1e10; // evita errores como 0.1 + 0.2 = 0.30000000000000004
    return Math.abs(limpio) >= 1e12 ? "El resultado es demasiado grande" : limpio;
}
// Obtiene el resultado, lo guarda en el historial y lo deja en pantalla
function igual() {
    if (!estado.operador) return true;
    const res = resolver();
    if (typeof res === "string") { estado = { ...ORIGINAL, historial: estado.historial, error: res }; return false; }
    const linea = texto(estado.previo) + " " + SIMBOLOS[estado.operador] + " " + texto(Number(estado.actual)) + " = " + texto(res);
    estado.historial = [linea, ...estado.historial].slice(0, 5);
    estado.actual = String(res); estado.previo = null; estado.operador = null; estado.nuevo = true;
    return true;
}
// ===== TECLAS =====
// Agrega una cifra al número en pantalla (máximo 12 cifras)
function digito(d) {
    estado.error = "";
    if (estado.nuevo) { estado.actual = d; estado.nuevo = false; }
    else if (estado.actual.length < 12) estado.actual = estado.actual === "0" ? d : estado.actual + d;
}
// Agrega el punto decimal una sola vez
function punto() {
    estado.error = "";
    if (estado.nuevo) { estado.actual = "0."; estado.nuevo = false; }
    else if (!estado.actual.includes(".")) estado.actual += ".";
}
// Guarda la operación; si ya había una pendiente, primero la resuelve (ej: 2 + 3 + ...)
function operador(op) {
    estado.error = "";
    if (estado.operador && !estado.nuevo && !igual()) return;
    estado.previo = Number(estado.actual); estado.operador = op; estado.nuevo = true;
}
// Borra el último dígito escrito
function borrar() {
    if (estado.nuevo) return;
    estado.actual = estado.actual.slice(0, -1);
    if (estado.actual === "" || estado.actual === "-") estado.actual = "0";
}
// Cambia el signo del número en pantalla (positivo o negativo)
function signo() {
    if (Number(estado.actual) !== 0) estado.actual = estado.actual.startsWith("-") ? estado.actual.slice(1) : "-" + estado.actual;
}
// Borra todo menos el historial
function limpiar() { estado = { ...ORIGINAL, historial: estado.historial }; }
// ===== EVENTOS =====
// Une cada tipo de tecla con su función
const acciones = { digito, punto, operador, igual, borrar, signo, limpiar };
function ejecutar(tipo, valor) { acciones[tipo](valor); guardar(); pintar(); }
// Un solo "escucha" en el teclado sirve para todos los botones
$("teclado").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ejecutar(b.dataset.tipo, b.dataset.valor); });
// Permite usar el teclado del computador
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // no interferir con atajos como Ctrl + (zoom)
    const k = e.key; let tipo = "";
    if (/^[0-9]$/.test(k)) tipo = "digito";
    else if (k === "." || k === ",") tipo = "punto";
    else if ("+-*/".includes(k)) tipo = "operador";
    else if (k === "Enter" || k === "=") tipo = "igual";
    else if (k === "Backspace") tipo = "borrar";
    else if (k === "Escape") tipo = "limpiar";
    if (!tipo) return;
    e.preventDefault(); ejecutar(tipo, k);
});
$("btn-borrar").addEventListener("click", () => { estado.historial = []; guardar(); pintar(); });
// ===== ARRANQUE =====
// Al cargar la página se recupera lo guardado y se muestra de nuevo
cargar();
pintar();