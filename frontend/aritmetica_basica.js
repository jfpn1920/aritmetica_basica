//-------------------------------------//
//--|funcionalidad_aritmetica_basica|--//
//-------------------------------------//
const CLAVE = "aritmeticaBasica";
const SIMBOLOS = {
    "+": "+", "-": "−", "*": "×", "/": "÷"
}; 
const ORIGINAL = {
    actual: "0", previo: null, operador: null, nuevo: true, error: "", historial: []
};
let estado = { ...ORIGINAL };                     
const $ = (id) => document.getElementById(id);    
const texto = (n) => String(n).replace(".", ","); 
//-------------------------------------------------------//
//--|guardar_y_recuperar_el_estado_usando_localstorage|--//
//-------------------------------------------------------//
function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
}
function cargar() {
    const g = localStorage.getItem(CLAVE);
    if (g) {
        estado = {
            ...ORIGINAL, ...JSON.parse(g)
        };
    }
}
//-------------------------//
//--|colocar_en_pantalla|--//
//-------------------------//
function pintar() {
    $("resultado").textContent = texto(estado.actual);
    $("expresion").textContent = estado.error || (estado.operador ? texto(estado.previo) + " " + SIMBOLOS[estado.operador] : "");
    $("historial").innerHTML = "";
    estado.historial.forEach((linea) => {
        const li = document.createElement("li");
        li.textContent = linea;
        $("historial").appendChild(li);
    });
    document.querySelectorAll(".op").forEach((b) => {
        b.classList.toggle("activo", estado.nuevo && b.dataset.valor === estado.operador);
    });
}
//-----------------------------//
//--|colocar_las_operaciones|--//
//-----------------------------//
function resolver() {
    const a = estado.previo;
    const b = Number(estado.actual);
    const op = estado.operador;
    if (op === "/" && b === 0) {
        return "No se puede dividir entre 0";
    }
    const r = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b;
    const limpio = Math.round(r * 1e10) / 1e10;
    return Math.abs(limpio) >= 1e12 ? "El resultado es demasiado grande" : limpio;
}
//--------------------------//
//--|obtiene_el_resultado|--//
//--------------------------//
function igual() {
    if (!estado.operador) {
        return true;
    }
    const res = resolver();
    if (typeof res === "string") {
        estado = {
            ...ORIGINAL, historial: estado.historial, error: res
        };
        return false;
    }
    const linea = texto(estado.previo) + " " + SIMBOLOS[estado.operador] + " " + texto(Number(estado.actual)) + " = " + texto(res);
    estado.historial = [linea, ...estado.historial].slice(0, 5);
    estado.actual = String(res);
    estado.previo = null;
    estado.operador = null;
    estado.nuevo = true;
    return true;
}
//---------------------//
//--|uso_del_teclado|--//
//---------------------//
function digito(d) {
    estado.error = "";
    if (estado.nuevo) {
        estado.actual = d;
        estado.nuevo = false;
    } 
    else if (estado.actual.length < 12) {
        estado.actual = estado.actual === "0" ? d : estado.actual + d;
    }
}
//-----------------------------//
//--|agrega_el_punto_decimal|--//
//-----------------------------//
function punto() {
    estado.error = "";
    if (estado.nuevo) {
        estado.actual = "0.";
        estado.nuevo = false;
    } 
    else if (!estado.actual.includes(".")) {
        estado.actual += ".";
    }
}
//-----------------------------------------------//
//--|guardar_y_borrar_las_operaciones_escritos|--//
//-----------------------------------------------//
function operador(op) {
    estado.error = "";
    if (estado.operador && !estado.nuevo && !igual()) {
        return;
    }
    estado.previo = Number(estado.actual);
    estado.operador = op;
    estado.nuevo = true;
}
function borrar() {
    if (estado.nuevo) {
        return;
    }
    estado.actual = estado.actual.slice(0, -1);
    if (estado.actual === "" || estado.actual === "-") {
        estado.actual = "0";
    }
}
//--------------------------------------------//
//--|cambia_el_signo_del_numero_en_pantalla|--//
//--------------------------------------------//
function signo() {
    if (Number(estado.actual) !== 0) {
        estado.actual = estado.actual.startsWith("-") ? estado.actual.slice(1) : "-" + estado.actual;
    }
}
//-----------------------------------//
//--|borra_todo_menos_el_historial|--//
//-----------------------------------//
function limpiar() {
    estado = {
        ...ORIGINAL, historial: estado.historial
    };
}
//-----------------------//
//--|evento_a_un_click|--//
//-----------------------//
const acciones = {
    digito, punto, operador, igual, borrar, signo, limpiar
};
function ejecutar(tipo, valor) {
    acciones[tipo](valor);
    guardar();
    pintar();
}
$("teclado").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) {
        ejecutar(b.dataset.tipo, b.dataset.valor);
    }
});
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }
    const k = e.key;
    let tipo = "";
    if (/^[0-9]$/.test(k)) {
        tipo = "digito";
    } 
    else if (k === "." || k === ",") {
        tipo = "punto";
    } 
    else if ("+-*/".includes(k)) {
        tipo = "operador";
    } 
    else if (k === "Enter" || k === "=") {
        tipo = "igual";
    } 
    else if (k === "Backspace") {
        tipo = "borrar";
    } 
    else if (k === "Escape") {
        tipo = "limpiar";
    }
    if (!tipo) {
        return;
    }
    e.preventDefault();
    ejecutar(tipo, k);
});
$("btn-borrar").addEventListener("click", () => {
    estado.historial = [];
    guardar();
    pintar();
});
//----------------------------------//
//--|cargar_arranque_del_programa|--//
//----------------------------------//
cargar();
pintar();