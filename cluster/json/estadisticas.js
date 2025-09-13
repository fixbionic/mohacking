  // Configuración inicial
    const PASSWORD = "1234"; // Contraseña para retiros y operaciones sensibles
    
    document.addEventListener('DOMContentLoaded', function() {
      // Establecer fechas actuales en los formularios
      const hoy = new Date().toISOString().split('T')[0];
      document.getElementById('fechaIngreso').value = hoy;
      document.getElementById('fechaRetiro').value = hoy;
      document.getElementById('fechaDebemos').value = hoy;
      document.getElementById('fechaNosDeben').value = hoy;
      
      // Cargar datos de la caja menor y deudas
      cargarDatosCajaMenor();
      cargarDeudas();
    });

    // Función para cargar datos de la caja menor desde localStorage
    function cargarDatosCajaMenor() {
      const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
      
      // Actualizar saldo
      document.getElementById('saldoCaja').textContent = `$${datosCaja.saldo.toLocaleString()}`;
      
      // Cargar historial si es necesario
      if (datosCaja.movimientos.length > 0) {
        const tablaHistorial = document.getElementById('tablaHistorial');
        tablaHistorial.innerHTML = '';
        
        datosCaja.movimientos.forEach((movimiento, index) => {
          const fila = document.createElement('tr');
          fila.innerHTML = `
            <td>${new Date(movimiento.fecha).toLocaleDateString()}</td>
            <td><span class="badge ${movimiento.tipo === 'ingreso' ? 'bg-success' : 'bg-danger'}">${movimiento.tipo}</span></td>
            <td>${movimiento.concepto}</td>
            <td>$${movimiento.monto.toLocaleString()}</td>
            <td>$${movimiento.saldo.toLocaleString()}</td>
            <td>
              <button class="btn btn-sm btn-outline-warning editar-movimiento" data-id="${index}">Editar</button>
              <button class="btn btn-sm btn-outline-danger eliminar-movimiento" data-id="${index}">Eliminar</button>
            </td>
          `;
          tablaHistorial.appendChild(fila);
        });
        
        // Agregar event listeners a los botones de editar y eliminar
        document.querySelectorAll('.editar-movimiento').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editarMovimiento(id);
          });
        });
        
        document.querySelectorAll('.eliminar-movimiento').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmarEliminacionMovimiento(id);
          });
        });
      }
    }
    
    // Función para cargar deudas desde localStorage
    function cargarDeudas() {
      const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
      
      // Calcular totales
      let totalDebemos = 0;
      let totalNosDeben = 0;
      
      deudas.debemos.forEach(deuda => {
        if (!deuda.entregado) totalDebemos += deuda.monto;
      });
      
      deudas.nosDeben.forEach(deuda => {
        if (!deuda.entregado) totalNosDeben += deuda.monto;
      });
      
      // Actualizar totales en la interfaz
      document.getElementById('totalDeudas').textContent = `$${totalDebemos.toLocaleString()}`;
      document.getElementById('totalPrestamos').textContent = `$${totalNosDeben.toLocaleString()}`;
      
      // Cargar tablas de deudas
      const tablaDebemos = document.getElementById('tablaDebemos');
      tablaDebemos.innerHTML = '';
      
      deudas.debemos.forEach((deuda, index) => {
        const fila = document.createElement('tr');
        if (deuda.entregado) fila.classList.add('deuda-pagada');
        
        fila.innerHTML = `
          <td>${new Date(deuda.fecha).toLocaleDateString()}</td>
          <td>${deuda.concepto}</td>
          <td>$${deuda.monto.toLocaleString()}</td>
          <td>${deuda.persona}</td>
          <td>${deuda.entregado ? 'Pagada' : 'Pendiente'}</td>
          <td>
            <button class="btn btn-sm btn-outline-warning editar-deuda" data-tipo="debemos" data-id="${index}">Editar</button>
            <button class="btn btn-sm btn-outline-danger eliminar-deuda" data-tipo="debemos" data-id="${index}">Eliminar</button>
            ${!deuda.entregado ? `<button class="btn btn-sm btn-outline-success marcar-pagada" data-tipo="debemos" data-id="${index}">Marcar Pagada</button>` : ''}
          </td>
        `;
        tablaDebemos.appendChild(fila);
      });
      
      const tablaNosDeben = document.getElementById('tablaNosDeben');
      tablaNosDeben.innerHTML = '';
      
      deudas.nosDeben.forEach((deuda, index) => {
        const fila = document.createElement('tr');
        if (deuda.entregado) fila.classList.add('deuda-pagada');
        
        fila.innerHTML = `
          <td>${new Date(deuda.fecha).toLocaleDateString()}</td>
          <td>${deuda.concepto}</td>
          <td>$${deuda.monto.toLocaleString()}</td>
          <td>${deuda.persona}</td>
          <td>${deuda.entregado ? 'Pagada' : 'Pendiente'}</td>
          <td>
            <button class="btn btn-sm btn-outline-warning editar-deuda" data-tipo="nosDeben" data-id="${index}">Editar</button>
            <button class="btn btn-sm btn-outline-danger eliminar-deuda" data-tipo="nosDeben" data-id="${index}">Eliminar</button>
            ${!deuda.entregado ? `<button class="btn btn-sm btn-outline-success marcar-pagada" data-tipo="nosDeben" data-id="${index}">Marcar Pagada</button>` : ''}
          </td>
        `;
        tablaNosDeben.appendChild(fila);
      });
      
      // Agregar event listeners a los botones de deudas
      agregarEventListenersDeudas();
    }
    
    // Función para agregar event listeners a los botones de deudas
    function agregarEventListenersDeudas() {
      document.querySelectorAll('.editar-deuda').forEach(btn => {
        btn.addEventListener('click', function() {
          const tipo = this.getAttribute('data-tipo');
          const id = this.getAttribute('data-id');
          editarDeuda(tipo, id);
        });
      });
      
      document.querySelectorAll('.eliminar-deuda').forEach(btn => {
        btn.addEventListener('click', function() {
          const tipo = this.getAttribute('data-tipo');
          const id = this.getAttribute('data-id');
          confirmarEliminacionDeuda(tipo, id);
        });
      });
      
      document.querySelectorAll('.marcar-pagada').forEach(btn => {
        btn.addEventListener('click', function() {
          const tipo = this.getAttribute('data-tipo');
          const id = this.getAttribute('data-id');
          marcarDeudaPagada(tipo, id);
        });
      });
    }

    // Guardar datos de la caja menor en localStorage
    function guardarDatosCajaMenor(datos) {
      localStorage.setItem('cajaMenor', JSON.stringify(datos));
    }
    
    // Guardar deudas en localStorage
    function guardarDeudas(deudas) {
      localStorage.setItem('deudas', JSON.stringify(deudas));
    }

    // Manejar ingreso de dinero
    document.getElementById('btnConfirmarIngreso').addEventListener('click', function() {
      const monto = parseFloat(document.getElementById('montoIngreso').value);
      const concepto = document.getElementById('conceptoIngreso').value;
      const fecha = document.getElementById('fechaIngreso').value;
      
      if (monto > 0 && concepto && fecha) {
        // Obtener datos actuales
        const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
        
        // Actualizar saldo
        datosCaja.saldo += monto;
        
        // Agregar movimiento al historial
        datosCaja.movimientos.push({
          fecha: fecha,
          tipo: 'ingreso',
          concepto: concepto,
          monto: monto,
          saldo: datosCaja.saldo
        });
        
        // Guardar cambios
        guardarDatosCajaMenor(datosCaja);
        
        // Actualizar interfaz
        cargarDatosCajaMenor();
        
        // Cerrar modal y limpiar formulario
        bootstrap.Modal.getInstance(document.getElementById('modalIngreso')).hide();
        document.getElementById('formIngreso').reset();
        document.getElementById('fechaIngreso').value = new Date().toISOString().split('T')[0];
      }
    });

    // Manejar retiro de dinero
    document.getElementById('btnConfirmarRetiro').addEventListener('click', function() {
      const monto = parseFloat(document.getElementById('montoRetiro').value);
      const concepto = document.getElementById('conceptoRetiro').value;
      const fecha = document.getElementById('fechaRetiro').value;
      const password = document.getElementById('passwordRetiro').value;
      
      // Verificar contraseña
      if (password !== PASSWORD) {
        alert('Contraseña incorrecta. No puede retirar dinero sin la contraseña correcta.');
        return;
      }
      
      // Obtener datos actuales
      const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
      
      if (monto > 0 && concepto && fecha && monto <= datosCaja.saldo) {
        // Actualizar saldo
        datosCaja.saldo -= monto;
        
        // Agregar movimiento al historial
        datosCaja.movimientos.push({
          fecha: fecha,
          tipo: 'retiro',
          concepto: concepto,
          monto: monto,
          saldo: datosCaja.saldo
        });
        
        // Guardar cambios
        guardarDatosCajaMenor(datosCaja);
        
        // Actualizar interfaz
        cargarDatosCajaMenor();
        
        // Cerrar modal y limpiar formulario
        bootstrap.Modal.getInstance(document.getElementById('modalRetiro')).hide();
        document.getElementById('formRetiro').reset();
        document.getElementById('fechaRetiro').value = new Date().toISOString().split('T')[0];
        document.getElementById('passwordRetiro').value = '';
      } else if (monto > datosCaja.saldo) {
        alert('No hay suficiente saldo en la caja para realizar este retiro.');
      }
    });
    
    // Manejar registro de lo que debemos
    document.getElementById('btnConfirmarDebemos').addEventListener('click', function() {
      const monto = parseFloat(document.getElementById('montoDebemos').value);
      const concepto = document.getElementById('conceptoDebemos').value;
      const fecha = document.getElementById('fechaDebemos').value;
      const persona = document.getElementById('personaDebemos').value;
      const entregado = document.getElementById('entregadoDebemos').checked;
      
      if (monto > 0 && concepto && fecha && persona) {
        // Obtener datos actuales
        const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
        
        // Agregar deuda
        deudas.debemos.push({
          fecha: fecha,
          concepto: concepto,
          monto: monto,
          persona: persona,
          entregado: entregado
        });
        
        // Guardar cambios
        guardarDeudas(deudas);
        
        // Actualizar interfaz
        cargarDeudas();
        
        // Cerrar modal y limpiar formulario
        bootstrap.Modal.getInstance(document.getElementById('modalDebemos')).hide();
        document.getElementById('formDebemos').reset();
        document.getElementById('fechaDebemos').value = new Date().toISOString().split('T')[0];
        document.getElementById('entregadoDebemos').checked = false;
      }
    });
    
    // Manejar registro de lo que nos deben
    document.getElementById('btnConfirmarNosDeben').addEventListener('click', function() {
      const monto = parseFloat(document.getElementById('montoNosDeben').value);
      const concepto = document.getElementById('conceptoNosDeben').value;
      const fecha = document.getElementById('fechaNosDeben').value;
      const persona = document.getElementById('personaNosDeben').value;
      const entregado = document.getElementById('entregadoNosDeben').checked;
      
      if (monto > 0 && concepto && fecha && persona) {
        // Obtener datos actuales
        const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
        
        // Agregar deuda
        deudas.nosDeben.push({
          fecha: fecha,
          concepto: concepto,
          monto: monto,
          persona: persona,
          entregado: entregado
        });
        
        // Guardar cambios
        guardarDeudas(deudas);
        
        // Actualizar interfaz
        cargarDeudas();
        
        // Cerrar modal y limpiar formulario
        bootstrap.Modal.getInstance(document.getElementById('modalNosDeben')).hide();
        document.getElementById('formNosDeben').reset();
        document.getElementById('fechaNosDeben').value = new Date().toISOString().split('T')[0];
        document.getElementById('entregadoNosDeben').checked = false;
      }
    });
    
    // Función para confirmar eliminación de movimiento
    function confirmarEliminacionMovimiento(id) {
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
      document.getElementById('modalConfirmacionTitulo').textContent = 'Confirmar eliminación';
      document.getElementById('modalConfirmacionCuerpo').textContent = '¿Está seguro de que desea eliminar este movimiento? Esta acción no se puede deshacer.';
      
      document.getElementById('btnConfirmarAccion').onclick = function() {
        const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
        const movimiento = datosCaja.movimientos[id];
        
        // Revertir el efecto en el saldo
        if (movimiento.tipo === 'ingreso') {
          datosCaja.saldo -= movimiento.monto;
        } else {
          datosCaja.saldo += movimiento.monto;
        }
        
        // Eliminar el movimiento
        datosCaja.movimientos.splice(id, 1);
        
        // Guardar cambios
        guardarDatosCajaMenor(datosCaja);
        
        // Actualizar interfaz
        cargarDatosCajaMenor();
        
        // Cerrar modal
        modal.hide();
      };
      
      modal.show();
    }
    
    // Función para confirmar eliminación de deuda
    function confirmarEliminacionDeuda(tipo, id) {
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
      document.getElementById('modalConfirmacionTitulo').textContent = 'Confirmar eliminación';
      document.getElementById('modalConfirmacionCuerpo').textContent = '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.';
      
      document.getElementById('btnConfirmarAccion').onclick = function() {
        const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
        
        // Eliminar la deuda
        deudas[tipo].splice(id, 1);
        
        // Guardar cambios
        guardarDeudas(deudas);
        
        // Actualizar interfaz
        cargarDeudas();
        
        // Cerrar modal
        modal.hide();
      };
      
      modal.show();
    }
    
    // Función para editar movimiento
    function editarMovimiento(id) {
      const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
      const movimiento = datosCaja.movimientos[id];
      
      // Llenar el formulario de edición
      document.getElementById('editMovimientoId').value = id;
      document.getElementById('editMovimientoTipo').value = movimiento.tipo;
      document.getElementById('editMonto').value = movimiento.monto;
      document.getElementById('editConcepto').value = movimiento.concepto;
      document.getElementById('editFecha').value = movimiento.fecha;
      
      // Mostrar modal de edición
      const modal = new bootstrap.Modal(document.getElementById('modalEditarMovimiento'));
      modal.show();
    }
    
    // Función para guardar la edición de movimiento
    document.getElementById('btnGuardarEdicionMovimiento').addEventListener('click', function() {
      const id = document.getElementById('editMovimientoId').value;
      const tipo = document.getElementById('editMovimientoTipo').value;
      const monto = parseFloat(document.getElementById('editMonto').value);
      const concepto = document.getElementById('editConcepto').value;
      const fecha = document.getElementById('editFecha').value;
      
      if (monto > 0 && concepto && fecha) {
        const datosCaja = JSON.parse(localStorage.getItem('cajaMenor')) || { saldo: 0, movimientos: [] };
        const movimientoOriginal = datosCaja.movimientos[id];
        
        // Revertir el efecto del movimiento original
        if (movimientoOriginal.tipo === 'ingreso') {
          datosCaja.saldo -= movimientoOriginal.monto;
        } else {
          datosCaja.saldo += movimientoOriginal.monto;
        }
        
        // Aplicar el nuevo monto
        if (tipo === 'ingreso') {
          datosCaja.saldo += monto;
        } else {
          datosCaja.saldo -= monto;
        }
        
        // Actualizar el movimiento
        datosCaja.movimientos[id] = {
          fecha: fecha,
          tipo: tipo,
          concepto: concepto,
          monto: monto,
          saldo: datosCaja.saldo
        };
        
        // Recalcular saldos para movimientos posteriores
        for (let i = parseInt(id) + 1; i < datosCaja.movimientos.length; i++) {
          if (datosCaja.movimientos[i].tipo === 'ingreso') {
            datosCaja.saldo += datosCaja.movimientos[i].monto;
          } else {
            datosCaja.saldo -= datosCaja.movimientos[i].monto;
          }
          datosCaja.movimientos[i].saldo = datosCaja.saldo;
        }
        
        // Guardar cambios
        guardarDatosCajaMenor(datosCaja);
        
        // Actualizar interfaz
        cargarDatosCajaMenor();
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('modalEditarMovimiento')).hide();
      }
    });
    
    // Función para editar deuda
    function editarDeuda(tipo, id) {
      const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
      const deuda = deudas[tipo][id];
      
      // Llenar el formulario de edición
      document.getElementById('editDeudaId').value = id;
      document.getElementById('editDeudaTipo').value = tipo;
      document.getElementById('editDeudaMonto').value = deuda.monto;
      document.getElementById('editDeudaConcepto').value = deuda.concepto;
      document.getElementById('editDeudaFecha').value = deuda.fecha;
      document.getElementById('editDeudaPersona').value = deuda.persona;
      document.getElementById('editDeudaEstado').checked = deuda.entregado;
      
      // Actualizar etiquetas según el tipo
      if (tipo === 'debemos') {
        document.getElementById('editDeudaPersonaLabel').textContent = 'A quien se lo debemos';
        document.getElementById('editDeudaEstadoLabel').textContent = '¿Ya se entregó?';
      } else {
        document.getElementById('editDeudaPersonaLabel').textContent = 'Quien nos debe';
        document.getElementById('editDeudaEstadoLabel').textContent = '¿Ya nos pagaron?';
      }
      
      // Mostrar modal de edición
      const modal = new bootstrap.Modal(document.getElementById('modalEditarDeuda'));
      modal.show();
    }
    
    // Función para guardar la edición de deuda
    document.getElementById('btnGuardarEdicionDeuda').addEventListener('click', function() {
      const id = document.getElementById('editDeudaId').value;
      const tipo = document.getElementById('editDeudaTipo').value;
      const monto = parseFloat(document.getElementById('editDeudaMonto').value);
      const concepto = document.getElementById('editDeudaConcepto').value;
      const fecha = document.getElementById('editDeudaFecha').value;
      const persona = document.getElementById('editDeudaPersona').value;
      const estado = document.getElementById('editDeudaEstado').checked;
      
      if (monto > 0 && concepto && fecha && persona) {
        const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
        
        // Actualizar la deuda
        deudas[tipo][id] = {
          fecha: fecha,
          concepto: concepto,
          monto: monto,
          persona: persona,
          entregado: estado
        };
        
        // Guardar cambios
        guardarDeudas(deudas);
        
        // Actualizar interfaz
        cargarDeudas();
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('modalEditarDeuda')).hide();
      }
    });
    
    // Función para marcar deuda como pagada
    function marcarDeudaPagada(tipo, id) {
      const deudas = JSON.parse(localStorage.getItem('deudas')) || { debemos: [], nosDeben: [] };
      
      // Marcar como pagada
      deudas[tipo][id].entregado = true;
      
      // Guardar cambios
      guardarDeudas(deudas);
      
      // Actualizar interfaz
      cargarDeudas();
    }

    // Enlace para acceder a la caja menor desde el menú
    document.getElementById('cajaMenorLink').addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('cajaMenorSection').scrollIntoView({ behavior: 'smooth' });
    });