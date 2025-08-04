document.addEventListener('DOMContentLoaded', function () {
  const formulario = document.getElementById('formulario');
  const tabla = document.getElementById('tabla-reparaciones');
  const loginForm = document.getElementById("login-form");
  const passwordEliminar = 'error';
  let filaSeleccionada = null;
  let grafico = null;

  const configJSON = {
    usuario: "admin",
    contraseña: "admin"
  };

  // =================== LOGIN ===================
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const passwordInput = document.getElementById("password");
      const errorMsg = document.getElementById("error-msg");
      const loginBox = document.getElementById("login-box");
      const panel = document.getElementById("panel");

      if (passwordInput.value === configJSON.contraseña) {
        loginBox.style.display = "none";
        panel.style.display = "block";
      } else {
        errorMsg.style.display = "block";
        loginBox.classList.add("shake");
        setTimeout(() => loginBox.classList.remove("shake"), 300);
      }
    });
  }

  // =================== CARGA INICIAL ===================
  const datosGuardados = JSON.parse(localStorage.getItem('reparaciones')) || [];
  datosGuardados.forEach(dato => agregarFila(dato, false));
  actualizarMetricas();

  // =================== SUBMIT FORM ===================
  if (formulario && tabla) {
    formulario.addEventListener('submit', function (e) {
      e.preventDefault();

      const nuevaReparacion = {
        fecha: document.getElementById('fecha').value,
        cliente: document.getElementById('cliente').value,
        modelo: document.getElementById('modelo').value,
        reparacion: document.getElementById('reparacion').value,
        tecnico: document.getElementById('tecnico').value,
        notas: document.getElementById('notas').value,
        controlID: document.getElementById('controlID').value,
        estado: document.getElementById('estado').value
      };

      agregarFila(nuevaReparacion, true);
      formulario.reset();
      actualizarMetricas();
    });
  }

  // =================== FUNCIONES ===================
  function agregarFila(data, guardar) {
    const fila = document.createElement('tr');

    const claseEstado =
      data.estado === 'entregado' ? 'estado-entregado' :
      data.estado === 'pendiente' ? 'estado-pendiente' : 'estado-nulo';

    fila.innerHTML = `
      <td>${data.fecha}</td>
      <td>${data.cliente}</td>
      <td>${data.modelo}</td>
      <td>${data.reparacion}</td>
      <td>${data.tecnico}</td>
      <td>${data.notas}</td>
      <td>${data.controlID}</td>
      <td class="${claseEstado}">${data.estado.charAt(0).toUpperCase() + data.estado.slice(1)}</td>
    `;

    fila.addEventListener('click', () => {
      if (filaSeleccionada) filaSeleccionada.classList.remove('seleccionada');
      filaSeleccionada = fila;
      filaSeleccionada.classList.add('seleccionada');
    });

    tabla.appendChild(fila);

    if (guardar) {
      const datosGuardados = JSON.parse(localStorage.getItem('reparaciones')) || [];
      datosGuardados.push(data);
      localStorage.setItem('reparaciones', JSON.stringify(datosGuardados));
    }
  }

  window.eliminarSeleccionada = function () {
    if (!filaSeleccionada) {
      alert('Selecciona una fila para eliminar.');
      return;
    }

    const confirmPass = prompt('Ingresa la contraseña para eliminar:');
    if (confirmPass !== passwordEliminar) {
      alert('Contraseña incorrecta.');
      return;
    }

    const controlID = filaSeleccionada.children[6].textContent;
    filaSeleccionada.remove();
    filaSeleccionada = null;

    let datosGuardados = JSON.parse(localStorage.getItem('reparaciones')) || [];
    datosGuardados = datosGuardados.filter(d => d.controlID !== controlID);
    localStorage.setItem('reparaciones', JSON.stringify(datosGuardados));

    alert('Reparación eliminada con éxito.');
    actualizarMetricas();
  };

  function actualizarMetricas() {
    const datos = JSON.parse(localStorage.getItem('reparaciones')) || [];

    const total = datos.length;
    const pendientes = datos.filter(d => d.estado === 'pendiente').length;
    const entregadas = datos.filter(d => d.estado === 'entregado').length;

    const totalEl = document.getElementById('total-reparaciones');
    const pendientesEl = document.getElementById('total-pendientes');
    const entregadasEl = document.getElementById('total-entregadas');

    if (totalEl) totalEl.textContent = total;
    if (pendientesEl) pendientesEl.textContent = pendientes;
    if (entregadasEl) entregadasEl.textContent = entregadas;

    const ctx = document.getElementById('graficoReparaciones')?.getContext('2d');
    if (!ctx) return;

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'Entregadas', 'No se ha hecho nada'],
        datasets: [{
          label: 'Reparaciones',
          data: [
            pendientes,
            entregadas,
            total - pendientes - entregadas
          ],
          backgroundColor: ['#ffc107', '#28a745', '#6c757d'],
          borderColor: ['#fff'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
});
