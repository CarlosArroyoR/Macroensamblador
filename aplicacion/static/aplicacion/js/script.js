/* ***** FUNCION PRINCIPAL, EXPANSOR DE MACROS ***** */

function expandMacros(input) {
    const lines = input.split('\n').map(line => line.trim());
    const macros = {};
    const expandedCode = [];
    let inMacro = false;
    let macroName = '';
    let macroContent = [];
    let macroParams = [];

    // Primera pasada: identificar macros
    for (const line of lines) {
        if (line.includes(': MACRO')) {
            inMacro = true;
            const parts = line.split(':');
            macroName = parts[0].trim();
            macroParams = parts[1]
                .replace('MACRO', '')
                .trim()
                .split(',')
                .map(param => param.trim());
            macroContent = [];
            continue;
        }
        if (line === 'ENDM') {
            inMacro = false;

            // Validar que los parámetros usados en la macro son consistentes
            const invalidReferences = [];
            macroContent.forEach(macroLine => {
                macroLine.match(/\b\w+\b/g)?.forEach(identifier => {
                    // Excluir instrucciones del ensamblador
                    if (!['LD', 'ADD', 'MUL', 'A'].includes(identifier) && !macroParams.includes(identifier)) {
                        invalidReferences.push(identifier);
                    }
                });
            });

            if (invalidReferences.length > 0) {
                throw new Error(
                    `Error en la definición de la macro '${macroName}': los identificadores no válidos ${invalidReferences.join(
                        ', '
                    )} no coinciden con los parámetros definidos (${macroParams.join(', ')}).`
                );
            }

            macros[macroName] = { content: macroContent, params: macroParams };
            continue;
        }
        if (inMacro) {
            macroContent.push(line);
        } else {
            expandedCode.push(line);
        }
    }

    // Segunda pasada: expandir las macros en el código
    const finalCode = [];
    for (const line of expandedCode) {
        const macroCallMatch = line.match(/^(\w+)\s*(.*)$/); // Detectar llamadas de macros
        if (macroCallMatch) {
            const [_, callName, argsString] = macroCallMatch;
            if (macros[callName]) {
                const args = argsString.split(',').map(arg => arg.trim());
                const { content: macroBody, params: macroParams } = macros[callName];

                if (args.length !== macroParams.length) {
                    throw new Error(
                        `Error al invocar la macro '${callName}': se esperaban ${macroParams.length} argumentos, pero se recibieron ${args.length}.`
                    );
                }

                // Si el cuerpo de la macro está vacío, no se agrega nada
                if (macroBody.length === 0) {
                    continue;
                }

                // Expandir el cuerpo de la macro
                for (const macroLine of macroBody) {
                    let expandedLine = macroLine;
                    args.forEach((arg, index) => {
                        const macroArg = macroParams[index];
                        expandedLine = expandedLine.replace(new RegExp(`\\b${macroArg}\\b`, 'g'), arg);
                    });
                    finalCode.push(expandedLine);
                }
            } else {
                finalCode.push(line); // Línea no reconocida como macro
            }
        } else {
            finalCode.push(line); // Línea normal
        }
    }

    // Unir las líneas en el código final
    return finalCode.join('\n');
}





/* ***** CodeMirror, editor de textos 1 ***** */
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "text/x-asm",  
    tabSize: 4 
});
editor.setSize("100%", "100%");
editor.focus();

/* ***** CodeMirror, editor de textos 2 ***** */
var editor2 = CodeMirror.fromTextArea(document.getElementById("editor2"), {
    lineNumbers: true,
    mode: "text/x-asm",
    tabSize: 4 
});
editor2.setSize("100%", "100%");


/* ***** Funciones para saber si el editor de texto necesita ser guardado para indicarlo con un color ***** */
let archivoAbierto = null;// Variable que almacena archivo abierto
// Función para marcar el estado como no guardado
function marcarComoNoGuardado() {
    savefile.classList.add("no-guardado");
}
// Función para marcar el estado como guardado
function marcarComoGuardado() {
    savefile.classList.remove("no-guardado");
}
// Función para resetear el estado de "no guardado" cuando se abre un archivo
function resetEstadoGuardado() {
    marcarComoGuardado();  // Si el archivo es abierto, se marca como guardado
}


/* ***** Obtener el contenido de un archivo ***** */
const divContenido = document.getElementById('editor'); 
const seleccion_de_archivos = document.getElementById('seleccion_de_archivos'); 

let elementoSeleccionado = null;

if (archivos){
    archivos.forEach(archivo => {
        
        const archivoDiv = document.createElement('div');
        archivoDiv.className = 'archivo_individual';

        archivoDiv.dataset.id = `${archivo.id}`;

        archivoDiv.innerHTML = `
            <img src="/aplicacion/static/aplicacion/img/asm.png" alt="">
            <p>${archivo.nombre}</p>
        `;

    
        archivoDiv.addEventListener('click', (event) => {
            event.preventDefault(); 

        
            if (elementoSeleccionado) {
                
                elementoSeleccionado.classList.remove('seleccionado');
            }

        
            archivoDiv.classList.add('seleccionado');

        
            elementoSeleccionado = archivoDiv;

            fetch(`/archivo/contenido/${archivo.id}/`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al obtener el contenido');
                    }
                    return response.json();
                })
                .then(data => {
                    archivoAbierto = archivo; 
                    editor.setValue(data.contenido);
                    editor2.setValue("");
                    resetEstadoGuardado();  
                    editor.on("change", () => {
                        marcarComoNoGuardado();
                    });
                    enableAllButtons()
                })
                .catch(error => {
                    mensaje("Hubo un error al abrir el archivo o el archivo ya no exite, vuelve a intentar.");

                    console.error('Error:', error);
                });
        });
    
        seleccion_de_archivos.appendChild(archivoDiv);
    });
}




/* ***** Nuevo de Archivos ***** */
let newfile = document.querySelector("#newfile")

newfile.addEventListener("click",()=>{
    console.log("se apreto")
    seleccion_de_archivos.innerHTML += `<div class='archivo_individual seleccionado' id="formArchivo">
                                            <img src="/aplicacion/static/aplicacion/img/asm.png" alt="">

                                            <form method='post' class="formulario_archivo">
                                                <input type='hidden' name='csrfmiddlewaretoken' value="${csrfToken}">
                                                <input type='text' name='nombre' placeholder='Sin nombre' autofocus>
                                                <button type='submit'><img src='/static/aplicacion/img/right.png'></button>
                                            </form>
                                        </div>`
    const formularioArchivo = seleccion_de_archivos.querySelector("#formArchivo");

    formularioArchivo.addEventListener("submit",(event)=>{
        event.preventDefault();
        const nombreArchivo = document.querySelector('input[name="nombre"]').value;

        $.ajax({
            url: '/guardar_archivo_nuevo/',
            type: 'POST',
            data: {
                'nombre': nombreArchivo
            },
            headers: {
                'X-CSRFToken': csrfToken 
            },
            success: function(data) {
                if (data.mensaje) {
                    console.log(data.mensaje);  
                     // Guarda la información en localStorage
                    localStorage.setItem('clickElementId', data.instancia);

                    // Recarga la página
                    window.location.reload();


                } else if (data.error) {
                    console.log(data.error); 
                    mensaje(data.error)
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                mensaje('Hubo un error al crear el archivo.');
            }
        });
    })
})

/* ***** Código que se ejecuta al cargar la página ***** */
//Se usa cuando se guarda o importa un archivo, da el click despues de recargar la pagina
document.addEventListener('DOMContentLoaded', function() {
    const clickElementId = localStorage.getItem('clickElementId');
    if (clickElementId) {
        const div = document.querySelector(`[data-id="${clickElementId}"]`);
        if (div) {
            div.click();
            mensaje("Archivo creado con exito")
        } else {
            mensaje('No se encontró el elemento');
        }
        // Limpia el valor en localStorage
        localStorage.removeItem('clickElementId');
    }
});


/* ***** Ejecuta la funcion para expandir las macros ***** */
enviar.addEventListener("click", ()=>{
    let seleccionado = document.querySelector(".seleccionado")
    id_archivo = seleccionado.dataset.id
    fetch(`/archivo/contenido/${id_archivo}/`)
                .then(response => {
                    if (!response.ok) {
                        mensaje('Error al obtener el contenido')
                        throw new Error('Error al obtener el contenido');
                    }
                    return response.json();
                })
                .then(data => {
                    try {
                        const expandedCode = expandMacros(data.contenido);
                        editor2.setValue(expandedCode);
                    } catch (error) {
                        mensaje(error.message);
                    }
                    

                })
                .catch(error => {
                    mensaje('Error:', error);
                });
})



/* ***** Importador de archivos ***** */
document.getElementById('openfile').addEventListener('click', function() {
    document.getElementById('archivo_z80').click();  // Hacer clic en el campo de entrada de archivo
});
document.getElementById('archivo_z80').addEventListener('change', function() {
    var archivo = this.files[0];  // Obtener el archivo seleccionado

    if (archivo) {
        var formData = new FormData();
        formData.append('archivo_z80', archivo);

        // Enviar el archivo al servidor mediante AJAX
        fetch('/cargar_archivo/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': '{{ csrf_token }}'  // Incluir el token CSRF
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensaje) {
                localStorage.setItem('clickElementId', data.instancia);
                window.location.reload();
            } else if (data.error) {
                console.error("No se pudo agregar el archivo")
            }
        })
        .catch(error => {
            mensaje('Error al cargar el archivo.');
        });
    }
});

/* ***** Funcion para guardar un archivo ***** */
savefile.addEventListener("click", function() {
    var contenido = editor.getValue();  // Obtener el contenido de CodeMirror

    // Enviar el contenido del archivo al servidor usando AJAX
    fetch('/guardar_archivo_editado/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': '{{ csrf_token }}',  // Asegúrate de incluir el token CSRF
        },
        body: `contenido=${encodeURIComponent(contenido)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje) {
            mensaje('Archivo guardado exitosamente: ' + data.nombre_archivo);
            marcarComoGuardado();
        } else if (data.error) {
            mensaje('Error: ' + data.error);
        }
    })
    .catch(error => {
        mensaje('Error al guardar el archivo: ' + error);
    });
});


/* ***** Habilitar y desabilitar botones ***** */
function disableAllButtons() {
    const buttons = document.querySelectorAll('#logos_expansion img'); // Selecciona todos los <img> dentro de #logos_expansion
    buttons.forEach(button => {
        button.setAttribute('disabled', true); // Agrega el atributo 'disabled'
        button.style.opacity = '0.5'; // Cambia la apariencia visual
        button.style.pointerEvents = 'none'; // Deshabilita interacciones
    });
}
// Función para habilitar todos los botones (imagenes <img>)
function enableAllButtons() {
    const buttons = document.querySelectorAll('#logos_expansion img'); // Selecciona todos los <img> dentro de #logos_expansion
    buttons.forEach(button => {
        button.removeAttribute('disabled'); // Elimina el atributo 'disabled'
        button.style.opacity = '1'; // Restaura la apariencia original
        button.style.pointerEvents = 'auto'; // Restaura interactividad
    });
}
disableAllButtons();//se desabilita por defecto al cargar la pagina


/* ***** Funcion para eliminar un archivo ***** */
document.getElementById('deletefile').addEventListener('click', function() {
    // Enviar solicitud AJAX para eliminar el archivo
    fetch("/eliminar_archivo/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': '{{ csrf_token }}',  // Asegúrate de incluir el token CSRF
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje) {
            mensaje(data.mensaje);  // Mensaje de éxito
            window.location.reload();
        } else if (data.error) {
            mensaje(data.error);  // Mensaje de error
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});


/* ***** Funcion para agregar el codigo al portapapeles (copiarlo) ***** */
document.getElementById('copyToClipboard').addEventListener('click', function() {
    // Obtener el contenido del editor
    const contenido = editor2.getValue();

    // Copiar al portapapeles
    navigator.clipboard.writeText(contenido)
        .then(() => {
            mensaje('¡Contenido copiado al portapapeles!');
        })
        .catch(err => {
            mensaje('Error al copiar al portapapeles:', err);
        });
});



/* ***** Descargar el archivo del codigo expandido ***** */
document.getElementById('downloadFile').addEventListener('click', function () {
    // Obtener el contenido del editor
    const contenido = editor2.getValue();

    // Obtener el nombre del archivo seleccionado
    const seleccionado = document.querySelector(".seleccionado");
    let nombreArchivo = "archivo.asm"; // Valor predeterminado

    if (seleccionado) {
        const nombreElemento = seleccionado.querySelector("p");
        if (nombreElemento) {
            const textoNombre = nombreElemento.textContent.trim();
            if (textoNombre) {
                nombreArchivo = textoNombre.endsWith(".asm") ? textoNombre : textoNombre + ".asm";
            }
        }
    }

    // Crear un archivo Blob con el contenido
    const blob = new Blob([contenido], { type: 'text/plain' });

    // Generar un enlace de descarga
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombreArchivo; // Establecer el nombre del archivo dinámicamente

    // Simular el clic para abrir el diálogo de descarga
    enlace.click();

    // Liberar memoria
    URL.revokeObjectURL(enlace.href);
});


/* ***** Funcion para mostrar mensajes ***** */
function mensaje(mensaje) {
    let mensajes = document.getElementById("mensajes");

    if (!mensajes) {
        console.error("Elemento con id 'mensajes' no encontrado.");
        return;
    }

    // Mostrar el mensaje después de 200ms
    setTimeout(() => {
        mensajes.style.display = "flex";
        mensajes.style.opacity = "1";
        mensajes.innerHTML = mensaje;

        // Ocultar el mensaje después de 2 segundos
        setTimeout(() => {
            mensajes.style.opacity = "0"; // Cambiar opacidad para transición
            setTimeout(() => {
                mensajes.style.display = "none"; // Ocultar después de que la opacidad llegue a 0
            }, 300); // Duración de la transición (debe coincidir con la definida en CSS)
        }, 5000);
    }, 300);
}


