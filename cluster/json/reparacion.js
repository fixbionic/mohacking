// === ESTADO GLOBAL ===
const state = {
  patronActual: [],
  set(prop, val) { this[prop] = val; }
};

const passwordEliminar = 'error';
let filaSeleccionada = null;
let grafico = null;

// === UTILIDADES ===
const $ = id => document.getElementById(id);
const qsa = sel => document.querySelectorAll(sel);
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

// === INICIALIZACIÓN ===
window.onload = () => {
  cargarDesdeLocalStorage();
  actualizarMetricas();
  manejarPatron();
  mostrarCampoContrasena();
  
  $('tipo-contrasena').addEventListener('change', mostrarCampoContrasena);
  $('btn-editar').addEventListener('click', editarSeleccionada);
  $('btn-eliminar').addEventListener('click', eliminarSeleccionada);
  $('buscarInput').addEventListener('input', e => buscarReparacion(e.target.value));
  $('btn-descargar-imagen').addEventListener('click', () => exportarSeleccionadaComoImagen());
  $('btn-imprimir').addEventListener('click', () => exportarSeleccionadaComoImagen('pos'));

  // Verificar que los elementos existen antes de agregar event listeners
  if ($('tipo-contrasena')) {
    $('tipo-contrasena').addEventListener('change', mostrarCampoContrasena);
  }

  if ($('btn-editar')) {
    $('btn-editar').addEventListener('click', editarSeleccionada);
  }

  if ($('btn-eliminar')) {
    $('btn-eliminar').addEventListener('click', eliminarSeleccionada);
  }

  if ($('buscarInput')) {
    $('buscarInput').addEventListener('input', e => buscarReparacion(e.target.value));
  }

  if ($('formulario')) {
    $('formulario').addEventListener('submit', e => {
      e.preventDefault();
      const tipo = $('tipo-contrasena') ? $('tipo-contrasena').value : 'pin';
      const patron = $('patron-input') ? $('patron-input').value : '';
      const pin = $('contrasena') ? $('contrasena').value : '';

      if (tipo === 'patron' && !patron.trim()) {
        if ($('errorPatron')) $('errorPatron').style.display = 'block';
        return;
      }

      const nuevaReparacion = {
        fecha: $('fecha') ? $('fecha').value : '',
        hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        cliente: $('cliente') ? $('cliente').value : '',
        telefono: $('telefono') ? $('telefono').value : '',
        modelo: $('modelo') ? $('modelo').value : '',
        reparacion: $('reparacion') ? $('reparacion').value : '',
        tecnico: $('tecnico') ? $('tecnico').value : '',
        notas: $('notas') ? $('notas').value : '',
        precio: $('precio') ? $('precio').value : '0',
        iva: calcularIVA($('precio') ? $('precio').value : '0'),
        controlID: generarID(),
        estado: $('estado') ? $('estado').value : 'pendiente',
        contrasena: tipo === 'pin' ? pin : patron
      };

      agregarFila(nuevaReparacion, true);
      if ($('formulario')) $('formulario').reset();
      mostrarCampoContrasena();
      actualizarMetricas();
    });
  }

  if ($('btn-guardar-json')) {
    $('btn-guardar-json').addEventListener('click', () => {
      const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reparaciones_${new Date().toLocaleDateString('es-CO')}.json`;
      a.click();
    });
  }

  if ($('btn-agregar-backup')) {
    $('btn-agregar-backup').addEventListener('click', () => {
      const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
      const copias = JSON.parse(localStorage.getItem('copiasSeguridad') || '[]');

      const nuevaCopia = {
        fecha: new Date().toLocaleString('es-CO'),
        tipo: 'reparaciones',
        datos: datos
      };

      copias.push(nuevaCopia);
      localStorage.setItem('copiasSeguridad', JSON.stringify(copias));
      alert('✅ Copia de seguridad guardada correctamente.');
    });
  }

  if ($('importarBD')) {
    $('importarBD').addEventListener('change', function () {
      const archivo = this.files[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = function (e) {
        try {
          const datosImportados = JSON.parse(e.target.result);
          if (!Array.isArray(datosImportados)) throw new Error("Formato incorrecto");

          localStorage.setItem('reparaciones', JSON.stringify(datosImportados));
          if ($('tabla-reparaciones')) $('tabla-reparaciones').innerHTML = '';
          datosImportados.forEach(d => agregarFila(d, false));
          actualizarMetricas();
          alert("Datos importados correctamente.");
        } catch (error) {
          console.error("Error al importar:", error);
          alert("Error al importar: El archivo no es válido.");
        }
      };
      lector.readAsText(archivo);
    });
  }

  if ($('btn-export-excel')) {
    $('btn-export-excel').addEventListener('click', () => {
      const soloUna = confirm('¿Exportar solo la fila seleccionada?\nAceptar: Solo una fila\nCancelar: Toda la tabla');
      soloUna && filaSeleccionada ? exportarFilaSeleccionadaExcel() : exportarTablaCompletaExcel();
    });
  }

  // Generar ID automático al cargar
  if ($('controlID')) {
    $('controlID').value = generarID();
  }
};

// === FUNCIONES AUXILIARES ===
let contadorID = localStorage.getItem('contadorID') ? parseInt(localStorage.getItem('contadorID')) : 0;

function generarID() {
  contadorID++;
  localStorage.setItem('contadorID', contadorID.toString());
  return 'ID-' + contadorID;
}

function calcularIVA(precio) {
  const iva = parseFloat(precio) * 0.19;
  return isNaN(iva) ? 0 : iva.toFixed(2);
}

// === PATRÓN / PIN ===
function mostrarCampoContrasena() {
  if (!$('tipo-contrasena')) return;

  const tipo = $('tipo-contrasena').value;
  if ($('contrasena')) $('contrasena').style.display = tipo === 'pin' ? 'block' : 'none';
  if ($('patron-container')) $('patron-container').style.display = tipo === 'patron' ? 'block' : 'none';
  if ($('errorPatron')) $('errorPatron').style.display = 'none';
  state.set('patronActual', []);
  qsa('.patron-btn').forEach(b => b.classList.remove('active'));
  if ($('patron-input')) $('patron-input').value = '';
}

function manejarPatron() {
  qsa('.patron-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.num;
      if (!state.patronActual.includes(val)) {
        state.patronActual.push(val);
        btn.classList.add('active');
        if ($('patron-input')) $('patron-input').value = state.patronActual.join('-');
      }
    });
  });
}

// === CRUD LOCALSTORAGE ===
function cargarDesdeLocalStorage() {
  const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
  datos.forEach(d => agregarFila(d, false));
}

function agregarFila(data, guardar = true) {
  if (!$('tabla-reparaciones')) return;

  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${data.fecha}</td>
    <td>${data.hora || ''}</td>
    <td>${data.cliente}</td>
    <td>${data.telefono}</td>
    <td>${data.modelo}</td>
    <td>${data.reparacion}</td>
    <td>${data.tecnico}</td>
    <td>${data.notas}</td>
    <td>$${parseFloat(data.precio).toLocaleString('es-CO')}</td>
    <td>${data.controlID}</td>
    <td class="${data.estado === 'entregado' ? 'table-success' : data.estado === 'pendiente' ? 'table-warning' : 'table-light'}">
      ${capitalize(data.estado)}
    </td>
    <td>${data.contrasena || ''}</td>
  `;

  fila.onclick = () => seleccionarFila(fila, data);

  $('tabla-reparaciones').prepend(fila);

  if (guardar) {
    const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
    datos.push(data);
    localStorage.setItem('reparaciones', JSON.stringify(datos));
  }
}

function seleccionarFila(fila, data) {
  if (filaSeleccionada) filaSeleccionada.classList.remove('table-info');
  filaSeleccionada = fila;
  filaSeleccionada.classList.add('table-info');

  for (const key in data) {
    if ($(key)) $(key).value = data[key];
  }

  const tipo = data.contrasena?.includes('-') ? 'patron' : 'pin';
  if ($('tipo-contrasena')) $('tipo-contrasena').value = tipo;
  mostrarCampoContrasena();

  if (tipo === 'patron') {
    const patron = data.contrasena.split('-');
    state.set('patronActual', patron);
    if ($('patron-input')) $('patron-input').value = data.contrasena;
    qsa('.patron-btn').forEach(btn => {
      btn.classList.toggle('active', patron.includes(btn.dataset.num));
    });
  } else {
    if ($('contrasena')) $('contrasena').value = data.contrasena;
  }
}

function eliminarSeleccionada() {
  if (!filaSeleccionada) return alert('Selecciona una fila');
  if (prompt('Contraseña para eliminar:') !== passwordEliminar) return alert('Contraseña incorrecta');

  const id = filaSeleccionada.querySelector('td:nth-child(11)').textContent;
  filaSeleccionada.remove();
  filaSeleccionada = null;

  let datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
  datos = datos.filter(d => d.controlID !== id);
  localStorage.setItem('reparaciones', JSON.stringify(datos));

  alert('Reparación eliminada');
  actualizarMetricas();
}

function editarSeleccionada() {
  if (!filaSeleccionada) return alert('Selecciona una fila');
  if (prompt('Contraseña para editar:') !== passwordEliminar) return alert('Contraseña incorrecta');

  const tipo = $('tipo-contrasena') ? $('tipo-contrasena').value : 'pin';
  const reparacionEditada = {
    fecha: $('fecha') ? $('fecha').value : '',
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    cliente: $('cliente') ? $('cliente').value : '',
    telefono: $('telefono') ? $('telefono').value : '',
    modelo: $('modelo') ? $('modelo').value : '',
    reparacion: $('reparacion') ? $('reparacion').value : '',
    tecnico: $('tecnico') ? $('tecnico').value : '',
    notas: $('notas') ? $('notas').value : '',
    precio: $('precio') ? $('precio').value : '0',
    iva: calcularIVA($('precio') ? $('precio').value : '0'),
    controlID: $('controlID') ? $('controlID').value : generarID(),
    estado: $('estado') ? $('estado').value : 'pendiente',
    contrasena: tipo === 'pin' ? ($('contrasena') ? $('contrasena').value : '') : ($('patron-input') ? $('patron-input').value : '')
  };
  
  const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
  const idx = datos.findIndex(d => d.controlID === filaSeleccionada.querySelector('td:nth-child(11)').textContent);
  if (idx !== -1) datos[idx] = reparacionEditada;
  localStorage.setItem('reparaciones', JSON.stringify(datos));

  filaSeleccionada.remove();
  agregarFila(reparacionEditada, false);
  alert('Reparación actualizada');
  if ($('formulario')) $('formulario').reset();
  mostrarCampoContrasena();
  filaSeleccionada = null;
  actualizarMetricas();
}

// === MÉTRICAS ===
function actualizarMetricas() {
  const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
  const total = datos.length;
  const pendientes = datos.filter(d => d.estado === 'pendiente').length;
  const entregadas = datos.filter(d => d.estado === 'entregado').length;

  if ($('total-reparaciones')) $('total-reparaciones').textContent = total;
  if ($('total-pendientes')) $('total-pendientes').textContent = pendientes;
  if ($('total-entregadas')) $('total-entregadas').textContent = entregadas;

  const ctx = $('graficoReparaciones')?.getContext('2d');
  if (!ctx) return;
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendientes', 'Entregadas', 'Otros'],
      datasets: [{
        data: [pendientes, entregadas, total - pendientes - entregadas],
        backgroundColor: ['#ffc107', '#28a745', '#6c757d'],
        borderColor: ['#fff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            }
          }
        }
      }
    }
  });
}

// === BUSCADOR ===
function buscarReparacion(valor) {
  if (!$('tabla-reparaciones')) return;

  const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];
  $('tabla-reparaciones').innerHTML = '';
  datos.forEach(d => {
    if (
      d.cliente.toLowerCase().includes(valor.toLowerCase()) ||
      d.modelo.toLowerCase().includes(valor.toLowerCase()) ||
      d.controlID.includes(valor)
    ) agregarFila(d, false);
  });
}
// === EXPORTACIÓN A EXCEL ===
function exportarTablaCompletaExcel() {
  const tabla = document.querySelector('table');
  if (!tabla) return alert('Tabla no encontrada');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabla);
  XLSX.utils.book_append_sheet(wb, ws, 'Reparaciones');
  XLSX.writeFile(wb, 'reparaciones_completas.xlsx');
}

function exportarFilaSeleccionadaExcel() {
  if (!filaSeleccionada) return alert('Selecciona una fila primero');

  const encabezados = Array.from(document.querySelectorAll('thead th')).map(th => th.textContent.trim());
  const datosFila = Array.from(filaSeleccionada.children).map(td => td.textContent.trim());

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([encabezados, datosFila]);
  XLSX.utils.book_append_sheet(wb, ws, 'Reparación');
  XLSX.writeFile(wb, 'reparacion_individual.xlsx');
}



// === EXPORTACIÓN DE IMAGEN/FACTURA ===
function exportarSeleccionadaComoImagen(tipo = null) {
  if (!filaSeleccionada) return alert('Selecciona una fila');

  const cel = filaSeleccionada.children;
  const facturaID = 'FBX-' + Date.now().toString().slice(-6);
  const fecha = new Date().toLocaleDateString('es-CO');

  const contenido = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Factura</title>
  <style>
    body {
      font-family: monospace;
      font-size: 11px;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .factura {
      max-width: 280px;
      padding: 10px;
      margin: 10px auto;
      border: 1px solid #000;
      box-sizing: border-box;
    }
    .center { text-align: center; }
    .logo {
      display: block;
      margin: 0 auto 10px auto;
      max-width: 100px;
      height: auto;
    }
    .linea {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .campo { margin-bottom: 4px; }
    @media print {
      @page { size: 70mm auto; margin: 0; }
      body { margin: 0; }
      .factura { border: none; padding: 8px; }
      .logo { max-width: 130px; height: auto; margin-bottom: 10px; }
      .campo { margin-bottom: 5px; }
    }
  </style>
</head>
<body onload="window.print(); window.close();">
  <div class="factura">
    <div class="center">
      <img src="../../data/img/a1.png" alt="Logo Fixbionic" class="logo" />
    </div>

    <div class="center">
      <strong>Fix_Bionic</strong><br />
      NIT: 1022421675-9<br />
      ESTABLECIMIENTO: FIX_Bionic<br />
      Cra 50 No. 51 - 29<br />
      CC Arquicentro<br />
      Itagüí, Antioquia, Colombia<br />
      Tel: (+57) 301 5920400<br />
      Registrado en el Régimen Simple de Tributación<br />
      No Responsable de IVA<br />
      Actividad Económica: 9511 - Mantenimiento y reparación de aparatos electrónicos de consumo
    </div>

    <div class="linea"></div>
    <div class="center"><strong>Factura Electrónica de Venta</strong></div>
    <div class="campo">Número: FE ${facturaID}</div>

<div class="campo">Fecha: ${fecha} ${cel[1].textContent}</div> <!-- 👈 usa fecha + hora -->

    <div class="campo">Forma de Pago: Contado</div>
    <div class="campo">Medio de Pago: Acuerdo mutuo</div>

    <div class="campo">Vendido por: ${cel[5].textContent}</div>
    <div class="campo">Cliente: ${cel[1].textContent}</div>
    <div class="campo">Teléfono: ${cel[2].textContent}</div>
    <div class="campo">Modelo: ${cel[3].textContent}</div>
    <div class="campo">Reparación: ${cel[4].textContent}</div>
    <div class="campo">Notas: ${cel[6].textContent}</div>

    <div class="linea"></div>
    <strong>Detalle:</strong><br />
    1 UND ${cel[4].textContent}<br />
    Precio Unitario: $${parseFloat(cel[7].textContent.replace('$', '')).toLocaleString('es-CO')}<br />
    Valor Total: $${parseFloat(cel[7].textContent.replace('$', '')).toLocaleString('es-CO')}<br />

    <div class="linea"></div>
    <strong>Total a Pagar:</strong> $${parseFloat(cel[7].textContent.replace('$', '')).toLocaleString('es-CO')}<br />
    Cambio: $0.00<br />
    Total Descuentos: $0.00<br />

    <div class="linea"></div>
    <strong>Discriminación Tarifas de IVA:</strong><br />
    Base: $${parseFloat(cel[8].textContent.replace('$', '')).toLocaleString('es-CO')}<br />
    IVA: $${(parseFloat(cel[7].textContent.replace('$', '')) - parseFloat(cel[8].textContent.replace('$', ''))).toLocaleString('es-CO')}<br />

    <div class="campo">Control ID: ${cel[9].textContent}</div>
    <div class="campo">Estado: ${cel[10].textContent}</div>
    <div class="campo">Contraseña: ${cel[11].textContent}</div>

    <div class="linea"></div>
    Autorización Numeración de Facturación<br />
    Resolución 187648078910412<br />
    Desde: 03/02/2025 - Hasta: 03/02/2027<br />
    Prefijo: FE - Desde N° 1 hasta N° 200

    <div class="linea"></div>
    <div class="center">**** Gracias por su compra ****</div>
    <div class="center">
      Impresa por Factura Ya - Software de Facturación<br />
      NIT: 901361537-1 - Proveedor Tecnológico Factura Ya
    </div>
  </div>
</body>
</html>
  `;

  const ventana = window.open('', '', 'width=380,height=700');
  ventana.document.open();
  ventana.document.write(contenido);
  ventana.document.close();
}