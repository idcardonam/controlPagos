function cargarRegistros() {
  // Lógica para cargar registros
  };

// 📌 Función principal que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "index.html") {
      configurarFormularioRegistro(); // Funcionalidad para registrar pagos
      configurarFormularioFiltros(); // Funcionalidad para filtros
      cargarListasGenerales(); // Cargar listas generales
    } else if (currentPage === "listas.html") {
      cargarListasGenerales(); // Cargar listas generales
      cargarListasConfiguracion(); // Funcionalidad para gestionar listas
      cargarElementosLista("companies", "items-companies");
      cargarElementosLista("bancos", "items-bancos");
      cargarElementosLista("jornadas", "items-jornadas");
      cargarElementosLista("categorias", "items-categorias");
    } else if (currentPage === "visualizacion.html") {
      cargarListasGenerales(); // Cargar listas generales
      configurarBotonAsignarContable(); // Configurar el botón de asignar número contable
      cargarRegistros(); // Cargar los registros en la tabla
    } else if (currentPage === "general.html") {
      cargarListasGenerales(); // Cargar listas generales
      configurarFormularioFiltros(); // Configurar el formulario de filtros
      cargarRegistrosGeneral(); // Cargar los registros en la tabla de general.html
      configurarEventosGlobales(); // Configurar eventos globales como selección de registros
    }
    
  const formFiltrar = document.getElementById("form-filtrar");
  const tablaRegistros = document.getElementById("tabla-registros").querySelector("tbody");
  

  // Manejar el evento de filtrado
  formFiltrar.addEventListener("submit", (event) => {
    event.preventDefault(); // Evitar recargar la página

    // Obtener los valores de los filtros
    const filtros = {
      compania: document.getElementById("filter-compania").value,
      jornada: document.getElementById("filter-jornada").value,
      categoria: document.getElementById("filter-categoria").value,
      banco: document.getElementById("filter-banco").value,
    };

    // Realizar la solicitud al backend
    fetch("/api/payments/filter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    })
      .then((response) => response.json())
      .then((data) => {
        // Limpiar la tabla
        tablaRegistros.innerHTML = "";

        // Insertar los registros filtrados en la tabla
        data.forEach((registro) => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td><input type="checkbox" value="${registro.id}"></td>
            <td>${registro.compania}</td>
            <td>${registro.fecha}</td>
            <td>${registro.jornada}</td>
            <td>${registro.categoria}</td>
            <td>${registro.subdivision}</td>
            <td>${registro.valor}</td>
            <td>${registro.banco}</td>
            <td>${registro.registroContable || "N/A"}</td>
          `;
          tablaRegistros.appendChild(fila);
        });
      })
      .catch((error) => {
        console.error("Error al filtrar los registros:", error);
        alert("Hubo un error al filtrar los registros.");
      });
  });
  
  
  const tablaGeneral = document.getElementById("tabla-general").querySelector("tbody");
  const modalEdit = document.getElementById("modal-edit");
  const formEditarRegistro = document.getElementById("form-editar-registro");
  const modalClose = document.getElementById("modal-close");

  function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`El elemento con el selector "${selector}" no existe en el DOM.`);
    }
    return element;
  }


  // Función para cargar los registros
  function cargarRegistros(filtros = {}) {
    const tablaRegistros = document.querySelector("#tabla-registros tbody");
    if (!tablaRegistros) {
      console.warn("La tabla de registros (#tabla-registros) no existe en el DOM.");
      return;
    }
  
    fetch("/api/payments/filter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al cargar los registros.");
        }
        return response.json();
      })
      .then((data) => {
        tablaRegistros.innerHTML = ""; // Limpiar la tabla
  
        if (data.length === 0) {
          const fila = document.createElement("tr");
          fila.innerHTML = `<td colspan="9">No se encontraron registros.</td>`;
          tablaRegistros.appendChild(fila);
          return;
        }
  
        data.forEach((registro) => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td><input type="checkbox" value="${registro.id}"></td>
            <td>${registro.compania || "N/A"}</td>
            <td>${registro.fecha || "N/A"}</td>
            <td>${registro.jornada || "N/A"}</td>
            <td>${registro.categoria || "N/A"}</td>
            <td>${registro.subdivision || "N/A"}</td>
            <td>${registro.valor || "N/A"}</td>
            <td>${registro.banco || "N/A"}</td>
            <td>${registro.registroContable || "Sin asignar"}</td>
          `;
          tablaRegistros.appendChild(fila);
        });
      })
      .catch((error) => {
        console.error("Error al cargar los registros:", error);
        alert("Ocurrió un error al cargar los registros. Por favor, intenta nuevamente.");
      });
  }

  // Función para manejar la edición de un registro
function editarRegistro(id) {
  fetch(`/api/payments/${id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener el registro.");
      }
      return response.json();
    })
    .then((registro) => {
      const modalEdit = getElement("#modal-edit");
      if (!modalEdit) return;
      // Llenar el formulario del modal con los datos del registro
      getElement("#edit-id").value = registro.id;
      getElement("#edit-compania").value = registro.compania || "";
      getElement("#edit-fecha").value = registro.fecha || "";
      getElement("#edit-jornada").value = registro.jornada || "";
      getElement("#edit-categoria").value = registro.categoria || "";
      getElement("#edit-subdivision").value = registro.subdivision || "";
      getElement("#edit-valor").value = registro.valor || "";
      getElement("#edit-banco").value = registro.banco || "";
      getElement("#edit-registro-contable").value = registro.registroContable || "";

      // Mostrar el modal
      modalEdit.style.display = "block";
    })
    .catch((error) => {
      console.error("Error al obtener el registro:", error);
      alert("Hubo un error al obtener el registro. Por favor, intenta nuevamente.");
    });
  }

  // Asignar eventos a los botones "Editar"
function agregarEventosEditar() {
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = event.target.dataset.id;
      editarRegistro(id);
    });
  });
}


  // 📌 Función para guardar los cambios del registro
  document.querySelector("#form-editar-registro").addEventListener("submit", (event) => {
    event.preventDefault();
  
    const id = document.querySelector("#edit-id").value;
    const registroActualizado = {
      compania: document.querySelector("#edit-compania").value,
      fecha: document.querySelector("#edit-fecha").value,
      jornada: document.querySelector("#edit-jornada").value,
      categoria: document.querySelector("#edit-categoria").value,
      subdivision: document.querySelector("#edit-subdivision").value,
      valor: document.querySelector("#edit-valor").value,
      banco: document.querySelector("#edit-banco").value,
      registroContable: document.querySelector("#edit-registro-contable").value,
    };
  
    fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registroActualizado),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`Error del servidor: ${errorText}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message || "Registro actualizado exitosamente.");
        document.querySelector("#modal-edit").style.display = "none"; // Cerrar el modal
        cargarRegistros(); // Recargar los registros
      })
      .catch((error) => {
        console.error("Error al actualizar el registro:", error);
        alert("Hubo un error al actualizar el registro. Por favor, intenta nuevamente.");
      });
  });


  // Función para abrir el modal de edición
  function abrirModalEditar(id) {
    fetch(`/api/payments/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los datos del registro.");
        }
        return response.json();
      })
      .then((registro) => {
        // Llenar los campos del modal con los datos del registro
        document.querySelector("#edit-id").value = registro.id;
        document.querySelector("#edit-compania").value = registro.compania || "";
        document.querySelector("#edit-fecha").value = registro.fecha || "";
        document.querySelector("#edit-jornada").value = registro.jornada || "";
        document.querySelector("#edit-categoria").value = registro.categoria || "";
        document.querySelector("#edit-subdivision").value = registro.subdivision || "";
        document.querySelector("#edit-valor").value = registro.valor || "";
        document.querySelector("#edit-banco").value = registro.banco || "";
        document.querySelector("#edit-registro-contable").value = registro.registroContable || "";
  
        // Mostrar el modal
        document.querySelector("#modal-edit").style.display = "block";
      })
      .catch((error) => {
        console.error("Error al cargar los datos del registro:", error);
        alert("No se pudieron cargar los datos del registro.");
      });
  }

  // Función para cerrar el modal
  modalClose.addEventListener("click", () => {
    modalEdit.style.display = "none";
  });

  // Función para guardar los cambios del registro
  formEditarRegistro.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = document.getElementById("edit-id").value;
    const registroActualizado = {
      compania: document.getElementById("edit-compania").value,
      fecha: document.getElementById("edit-fecha").value,
      jornada: document.getElementById("edit-jornada").value,
      categoria: document.getElementById("edit-categoria").value,
      subdivision: document.getElementById("edit-subdivision").value,
      valor: document.getElementById("edit-valor").value,
      banco: document.getElementById("edit-banco").value,
      registroContable: document.getElementById("edit-registro-contable").value,
    };

    fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registroActualizado),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.status || "Registro actualizado exitosamente.");
        modalEdit.style.display = "none";
        cargarRegistros(); // Recargar los registros
      })
      .catch((error) => {
        console.error("Error al actualizar el registro:", error);
        alert("Hubo un error al actualizar el registro.");
      });
  });

  // Función para eliminar un registro
function eliminarRegistro(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) return;
  
    fetch(`/api/payments/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`Error del servidor: ${errorText}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message || "Registro eliminado correctamente.");
        cargarRegistros(); // Recargar los registros después de la eliminación
      })
      .catch((error) => {
        console.error("Error al eliminar el registro:", error);
        alert("Hubo un error al eliminar el registro. Por favor, intenta nuevamente.");
      });
  }

  // Asignar eventos a los botones "Eliminar"
  function agregarEventosEliminar() {
    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const id = event.target.dataset.id;
        eliminarRegistro(id);
      });
    });
  }

  // Cargar los registros al cargar la página


// 📌 Configurar navegación entre páginas
function configurarNavegacion() {
  const btnGeneral = document.querySelector("#btn-general");
  const btnRegistrar = document.querySelector("#btn-registrar");
  const btnListas = document.querySelector("#btn-listas");

  if (btnGeneral) {
    btnGeneral.addEventListener("click", () => {
      window.location.href = "general.html";
    });
  }

  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (btnListas) {
    btnListas.addEventListener("click", () => {
      window.location.href = "listas.html";
    });
  }
}

// 📌 Configurar el formulario de registro de pagos
function configurarFormularioRegistro() {
  const formRegistrarPago = document.querySelector("#form-registrar-pago");
  if (!formRegistrarPago) return;

  formRegistrarPago.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevoPago = {
      compania: document.querySelector("#select-compania")?.value,
      jornada: document.querySelector("#select-jornada")?.value,
      subdivision: document.querySelector("#select-subdivision")?.value,
      banco: document.querySelector("#select-banco")?.value,
      fecha: document.querySelector("#input-fecha")?.value,
      categoria: document.querySelector("#select-categoria")?.value,
      valor: document.querySelector("#input-valor")?.value,
    };

    if (Object.values(nuevoPago).some((campo) => !campo)) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoPago),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        throw new Error("No se pudo registrar el pago. Intenta nuevamente.");
      }

      const data = await response.json();
      alert(data.message);
      formRegistrarPago.reset();
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      alert("Ocurrió un error al registrar el pago. Por favor, intenta nuevamente.");
    }
  });
}

// 📌 Configurar el formulario de filtros
function configurarFormularioFiltros() {
  const formFiltrar = document.querySelector("#form-filtrar");
  if (!formFiltrar) {
    console.warn("El formulario de filtros (#form-filtrar) no existe en el DOM.");
    return;
  }

  formFiltrar.addEventListener("submit", (e) => {
    e.preventDefault();

    // Capturar los valores de todos los campos del formulario
    const filtros = {
      compania: document.querySelector("#filter-compania")?.value || "",
      fechaInicio: document.querySelector("#filter-fecha-desde")?.value || "",
      fechaFin: document.querySelector("#filter-fecha-hasta")?.value || "",
      jornada: document.querySelector("#filter-jornada")?.value || "",
      categoria: document.querySelector("#filter-categoria")?.value || "",
      subdivision: document.querySelector("#filter-subdivision")?.value || "",
      valor: document.querySelector("#filter-valor")?.value || "",
      banco: document.querySelector("#filter-banco")?.value || "",
      registroContable: document.querySelector("#filter-registro-contable")?.value || "",
    };

    // Enviar los filtros al backend
    fetch("/api/payments/filter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`Error del servidor: ${errorText}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        actualizarTablaGeneral(data); // Actualizar la tabla con los resultados
      })
      .catch((error) => {
        console.error("Error al filtrar los registros:", error);
        alert("Ocurrió un error al filtrar los registros. Por favor, intenta nuevamente.");
      });
  });
}

function cargarRegistrosGeneral(filtros = {}) {
  const tablaGeneral = document.querySelector("#tabla-general tbody");
  if (!tablaGeneral) {
    console.warn("La tabla de registros (#tabla-general) no existe en el DOM.");
    return;
  }

  fetch("/api/payments/filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filtros),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los registros.");
      }
      return response.json();
    })
    .then((data) => {
      tablaGeneral.innerHTML = ""; // Limpiar la tabla

      if (data.length === 0) {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td colspan="11">No se encontraron registros.</td>`;
        tablaGeneral.appendChild(fila);
        return;
      }

      // Generar filas dinámicas con botones de editar y eliminar
      data.forEach((registro) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td><input type="checkbox" class="select-row" value="${registro.id}"></td>
          <td>${registro.id}</td>
          <td>${registro.compania || "N/A"}</td>
          <td>${registro.fecha || "N/A"}</td>
          <td>${registro.jornada || "N/A"}</td>
          <td>${registro.categoria || "N/A"}</td>
          <td>${registro.subdivision || "N/A"}</td>
          <td>${registro.valor || "N/A"}</td>
          <td>${registro.banco || "N/A"}</td>
          <td>${registro.registroContable || "Sin asignar"}</td>
          <td>
            <button class="btn-editar" data-id="${registro.id}">Editar</button>
            <button class="btn-eliminar" data-id="${registro.id}">Eliminar</button>
          </td>
        `;
        tablaGeneral.appendChild(fila);
      });

      // Agregar eventos a los botones de editar y eliminar
      agregarEventosEditar();
      agregarEventosEliminar();
    })
    .catch((error) => {
      console.error("Error al cargar los registros:", error);
      alert("Ocurrió un error al cargar los registros. Por favor, intenta nuevamente.");
    });
}

// 📌 Actualizar la tabla general con los registros filtrados
function actualizarTablaGeneral(registros) {
  const tbody = document.querySelector("#tabla-general tbody");
  if (!tbody) {
    console.warn("No se encontró la tabla para mostrar los registros.");
    return;
  }

  tbody.innerHTML = ""; // Limpiar la tabla antes de cargar nuevos datos

  if (registros.length === 0) {
    const fila = document.createElement("tr");
    fila.innerHTML = `<td colspan="10">No se encontraron registros.</td>`;
    tbody.appendChild(fila);
    return;
  }

  registros.forEach((registro) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${registro.id}</td>
      <td>${registro.compania || "N/A"}</td>
      <td>${registro.fecha || "N/A"}</td>
      <td>${registro.jornada || "N/A"}</td>
      <td>${registro.categoria || "N/A"}</td>
      <td>${registro.subdivision || "N/A"}</td>
      <td>${registro.valor || "N/A"}</td>
      <td>${registro.banco || "N/A"}</td>
      <td>${registro.registroContable || "Sin asignar"}</td>
      <td>
        <button class="btn-editar" data-id="${registro.id}">Editar</button>
        <button class="btn-eliminar" data-id="${registro.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Agregar eventos a los botones de editar y eliminar
  agregarEventosEditar();
  agregarEventosEliminar();
}

// 📌 Actualizar la tabla con los registros filtrados
function actualizarTabla(registros) {
  const tbody = document.querySelector("#tabla-registros tbody");
  if (!tbody) {
    console.warn("No se encontró la tabla para mostrar los registros.");
    return;
  }

  tbody.innerHTML = ""; // Limpiar la tabla antes de cargar nuevos datos

  registros.forEach((registro) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td><input type="checkbox" value="${registro.id}" data-id="${registro.id}"></td>
      <td>${registro.compania || "N/A"}</td>
      <td>${registro.fecha || "N/A"}</td>
      <td>${registro.jornada || "N/A"}</td>
      <td>${registro.categoria || "N/A"}</td>
      <td>${registro.subdivision || "N/A"}</td>
      <td>${registro.valor || "N/A"}</td>
      <td>${registro.banco || "N/A"}</td>
      <td>${registro.registroContable || "Sin asignar"}</td>
    `;
    tbody.appendChild(fila);
  });
}

// 📌 Configurar eventos globales
function configurarEventosGlobales() {
  // Botón de asignar número contable
  const btnAsignarContable = document.querySelector("#btn-asignar-contable");
  if (btnAsignarContable) {
    btnAsignarContable.addEventListener("click", asignarNumeroContable);
  }

  // Checkbox de seleccionar todos
  const selectAllCheckbox = document.querySelector("#select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll("#tabla-registros tbody input[type='checkbox']");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked;
      });
    });
  } else {
    console.warn("El checkbox de selección total (#select-all) no existe en el DOM.");
  }
}

// 📌 Función para asignar número contable
function asignarNumeroContable() {
  const seleccionados = Array.from(document.querySelectorAll("input[type='checkbox']:checked"))
    .map((checkbox) => checkbox.value);

  if (seleccionados.length === 0) {
    alert("Por favor, selecciona al menos un registro para asignar un número contable.");
    return;
  }

  fetch("/api/payments/assign-auto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: seleccionados }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Número contable asignado correctamente.");
      filtrarRegistros(); // Refrescar la tabla después de la asignación
    })
    .catch((error) => {
      console.error("Error al asignar número contable:", error);
      alert("Ocurrió un error al asignar el número contable. Por favor, intenta nuevamente.");
    });
}

// 📌 Cargar listas dinámicamente
function cargarListasGenerales() {
  fetch("/api/lists")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar las listas.");
      }
      return response.json();
    })
    .then((data) => {
      // Poblar los campos de filtros en general.html
      if (document.querySelector("#form-filtrar")) {
        poblarCampo("#filter-compania", data.companies);
        poblarCampo("#filter-banco", data.bancos);
        poblarCampo("#filter-jornada", data.jornadas);
        poblarCampo("#filter-categoria", data.categorias);
        poblarCampo("#filter-subdivision", data.subdivisiones);
        poblarCampo("#filter-registro-contable", data.registroContable); // Lista para Registro Contable
      }

      // Poblar los campos en index.html
      if (document.querySelector("#form-registrar-pago")) {
        poblarCampo("#select-compania", data.companies);
        poblarCampo("#select-jornada", data.jornadas);
        poblarCampo("#select-categoria", data.categorias);
        poblarCampo("#select-subdivision", data.subdivisiones);
        poblarCampo("#select-banco", data.bancos);
      }
    })
    .catch((error) => {
      console.error("Error al cargar las listas:", error);
      alert("Ocurrió un error al cargar las listas. Por favor, intenta nuevamente.");
    });
}

// 📌 Poblar un campo select con opciones
function poblarCampo(selector, opciones) {
  const campo = document.querySelector(selector);
  if (!campo) return;

  campo.innerHTML = '<option value="">--Seleccione--</option>'; // Limpiar las opciones existentes
  opciones.forEach((opcion) => {
    const option = document.createElement("option");
    option.value = opcion;
    option.textContent = opcion;
    campo.appendChild(option);
  });
}

// Llamar a cargarListas al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarListas();
});

// 📌 Filtrar registros
function filtrarRegistros() {
  // Obtener los valores de los campos del formulario
  const compania = document.querySelector("#filter-compania")?.value || "";
  const banco = document.querySelector("#filter-banco")?.value || "";
  const jornada = document.querySelector("#filter-jornada")?.value || "";
  const subdivision = document.querySelector("#filter-subdivision")?.value || "";
  const categoria = document.querySelector("#filter-categoria")?.value || "";
  const fecha = document.querySelector("#filter-fecha")?.value || "";

  // Construir la consulta para el backend
  let query = "?";
  if (compania) query += `compania=${encodeURIComponent(compania)}&`;
  if (banco) query += `banco=${encodeURIComponent(banco)}&`;
  if (jornada) query += `jornada=${encodeURIComponent(jornada)}&`;
  if (subdivision) query += `subdivision=${encodeURIComponent(subdivision)}&`;
  if (categoria) query += `categoria=${encodeURIComponent(categoria)}&`;
  if (fecha) query += `fecha=${encodeURIComponent(fecha)}&`;
  query = query.slice(0, -1); // Eliminar el último "&"

  // Enviar la solicitud al backend
  fetch("/api/payments" + query)
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      // Actualizar la tabla con los resultados
      actualizarTabla(data);
    })
    .catch((error) => {
      console.error("Error al filtrar los registros:", error);
      alert("Ocurrió un error al filtrar los registros. Por favor, intenta nuevamente.");
    });
}

// Seleccionar todos los registros
document.getElementById("select-all").addEventListener("change", function () {
  const checkboxes = document.querySelectorAll("tbody input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = this.checked;
  });
});



// Eliminar registros seleccionados
document.getElementById("btn-eliminar-seleccionados").addEventListener("click", function () {
  const seleccionados = Array.from(document.querySelectorAll("tbody input[type='checkbox']:checked"))
    .map((checkbox) => checkbox.value);

  if (seleccionados.length === 0) {
    alert("Por favor, selecciona al menos un registro para eliminar.");
    return;
  }

  if (!confirm("¿Estás seguro de que deseas eliminar los registros seleccionados?")) {
    return;
  }

  fetch("/api/payments/delete-multiple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: seleccionados }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Registros eliminados correctamente.");
      filtrarRegistros(); // Recargar la tabla después de la eliminación
    })
    .catch((error) => {
      console.error("Error al eliminar los registros:", error);
      alert("Ocurrió un error al eliminar los registros. Por favor, intenta nuevamente.");
    });
});

// Función para manejar la eliminación de un registro individual
function eliminarRegistro(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
    return;
  }

  fetch(`/api/payments/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Registro eliminado correctamente.");
      cargarRegistros(); // Recargar los registros después de la eliminación
    })
    .catch((error) => {
      console.error("Error al eliminar el registro:", error);
      alert("Ocurrió un error al eliminar el registro. Por favor, intenta nuevamente.");
    });
}

// Asignar eventos a los botones "Eliminar"
function agregarEventosEliminar() {
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = btn.getAttribute("data-id");
      const field = btn.getAttribute("data-field");

      if (!confirm("¿Estás seguro de que deseas eliminar este elemento?")) return;

      fetch(`/api/lists/${field}/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al eliminar el elemento.");
          }
          return response.json();
        })
        .then((data) => {
          alert(data.message || "Elemento eliminado exitosamente.");
          cargarElementosLista(field, `items-${field}`);
        })
        .catch((error) => {
          console.error(`Error al eliminar el elemento de la lista ${field}:`, error);
          alert("Ocurrió un error al eliminar el elemento. Por favor, intenta nuevamente.");
        });
    });
  });
}

function eliminarRegistro(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
    return;
  }

  fetch(`/api/payments/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Registro eliminado correctamente.");
      filtrarRegistros(); // Recargar la tabla después de la eliminación
    })
    .catch((error) => {
      console.error("Error al eliminar el registro:", error);
      alert("Ocurrió un error al eliminar el registro. Por favor, intenta nuevamente.");
    });
}

// Función para abrir el modal de edición y cargar los datos del registro
function editarRegistro(id) {
  fetch(`/api/payments/${id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener el registro.");
      }
      return response.json();
    })
    .then((registro) => {
      // Llenar el formulario del modal con los datos del registro
      const modalEdit = document.querySelector("#modal-edit");
      if (!modalEdit) return;

      document.querySelector("#edit-id").value = registro.id;
      document.querySelector("#edit-compania").value = registro.compania || "";
      document.querySelector("#edit-fecha").value = registro.fecha || "";
      document.querySelector("#edit-jornada").value = registro.jornada || "";
      document.querySelector("#edit-categoria").value = registro.categoria || "";
      document.querySelector("#edit-subdivision").value = registro.subdivision || "";
      document.querySelector("#edit-valor").value = registro.valor || "";
      document.querySelector("#edit-banco").value = registro.banco || "";
      document.querySelector("#edit-registro-contable").value = registro.registroContable || "";

      // Mostrar el modal
      modalEdit.style.display = "block";
    })
    .catch((error) => {
      console.error("Error al obtener el registro:", error);
      alert("Hubo un error al obtener el registro. Por favor, intenta nuevamente.");
    });
}

// Función para guardar los cambios del registro
document.querySelector("#form-editar-registro").addEventListener("submit", (event) => {
  event.preventDefault();

  const id = document.querySelector("#edit-id").value;
  const registroActualizado = {
    compania: document.querySelector("#edit-compania").value,
    fecha: document.querySelector("#edit-fecha").value,
    jornada: document.querySelector("#edit-jornada").value,
    categoria: document.querySelector("#edit-categoria").value,
    subdivision: document.querySelector("#edit-subdivision").value,
    valor: document.querySelector("#edit-valor").value,
    banco: document.querySelector("#edit-banco").value,
    registroContable: document.querySelector("#edit-registro-contable").value,
  };

  fetch(`/api/payments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registroActualizado),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`Error del servidor: ${errorText}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Registro actualizado exitosamente.");
      document.querySelector("#modal-edit").style.display = "none"; // Cerrar el modal
      cargarRegistros(); // Recargar los registros
    })
    .catch((error) => {
      console.error("Error al actualizar el registro:", error);
      alert("Hubo un error al actualizar el registro. Por favor, intenta nuevamente.");
    });
});

// 📌 Cargar listas específicas en la vista de configuración (listas.html)
function cargarListasConfiguracion() {
  fetch('/api/lists')
    .then((response) => response.json())
    .then((listas) => {
      const tablaListas = document.querySelector("#tabla-listas tbody");
      if (!tablaListas) {
        console.warn("El elemento #tabla-listas no existe en el DOM.");
        return;
      }

      tablaListas.innerHTML = "";

      if (listas.length === 0) {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td colspan="4">No se encontraron listas.</td>`;
        tablaListas.appendChild(fila);
        return;
      }

      listas.forEach((lista) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${lista.id}</td>
          <td>${lista.nombre}</td>
          <td>${lista.descripcion}</td>
          <td>
            <button class="btn-editar-lista" data-id="${lista.id}">Editar</button>
            <button class="btn-eliminar-lista" data-id="${lista.id}">Eliminar</button>
          </td>
        `;
        tablaListas.appendChild(fila);
      });

      agregarEventosListas();
    })
    .catch((error) => {
      console.error("Error al cargar las listas de configuración:", error);
    });
}

function cargarElementosLista(field, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`El contenedor con id "${containerId}" no existe en el DOM.`);
    return;
  }

  fetch(`/api/lists/${field}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error al cargar los elementos de la lista ${field}.`);
      }
      return response.json();
    })
    .then((data) => {
      container.innerHTML = ""; // Limpia el contenido existente

      if (data.length === 0) {
        container.innerHTML = "<p>No se encontraron elementos.</p>";
        return;
      }

      data.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("lista-item");
        div.innerHTML = `<span>${item}</span>`;
        container.appendChild(div);
      });
    })
    .catch((error) => {
      console.error(`Error al cargar los elementos de la lista ${field}:`, error);
      alert(`Ocurrió un error al cargar los elementos de la lista ${field}.`);
    });
}

document.querySelector("#form-agregar-lista").addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = document.querySelector("#add-nombre").value;
  const descripcion = document.querySelector("#add-descripcion").value;

  fetch('/api/lists', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message || "Lista agregada exitosamente.");
      cargarListas();
    })
    .catch((error) => {
      console.error("Error al agregar la lista:", error);
    });
});

function editarLista(id) {
  const nombre = prompt("Nuevo nombre:");
  const descripcion = prompt("Nueva descripción:");

  fetch(`/api/lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message || "Lista actualizada exitosamente.");
      cargarListas();
    })
    .catch((error) => {
      console.error("Error al actualizar la lista:", error);
    });
}

function eliminarLista(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta lista?")) return;

  fetch(`/api/lists/${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message || "Lista eliminada exitosamente.");
      cargarListas();
    })
    .catch((error) => {
      console.error("Error al eliminar la lista:", error);
    });
}

document.querySelectorAll(".form-lista").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Obtener el campo de la lista y el valor ingresado
    const field = form.getAttribute("data-field");
    const input = form.querySelector("input");
    const nombre = input.value.trim();

    // Validar que el campo no esté vacío
    if (!nombre) {
      alert("El campo no puede estar vacío.");
      return;
    }

    // Realizar la solicitud al backend para agregar el elemento
    fetch(`/api/lists/${field}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`Error del servidor: ${errorText}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        // Mostrar mensaje de éxito
        alert(data.message || "Elemento agregado exitosamente.");
        input.value = ""; // Limpiar el campo de entrada
        cargarElementosLista(field, `items-${field}`); // Recargar la lista
      })
      .catch((error) => {
        // Manejar errores y mostrar mensaje al usuario
        console.error(`Error al agregar un elemento a la lista ${field}:`, error);
        alert("Ocurrió un error al agregar el elemento. Por favor, intenta nuevamente.");
      });
  });
});

function agregarEventosEditarEliminar() {
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = btn.getAttribute("data-id");
      const field = btn.getAttribute("data-field");
      const nuevoNombre = prompt("Nuevo nombre:");

      if (!nuevoNombre) return;

      fetch(`/api/lists/${field}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre }),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message || "Elemento actualizado exitosamente.");
          cargarElementosLista(field, `items-${field}`);
        })
        .catch((error) => {
          console.error(`Error al actualizar el elemento de la lista ${field}:`, error);
        });
    });
  });

  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = btn.getAttribute("data-id");
      const field = btn.getAttribute("data-field");

      if (!confirm("¿Estás seguro de que deseas eliminar este elemento?")) return;

      fetch(`/api/lists/${field}/${id}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message || "Elemento eliminado exitosamente.");
          cargarElementosLista(field, `items-${field}`);
        })
        .catch((error) => {
          console.error(`Error al eliminar el elemento de la lista ${field}:`, error);
        });
    });
  });
}

function configurarBotonAsignarContable() {
  const btnAsignarContable = document.querySelector("#btn-asignar-contable");
  if (!btnAsignarContable) {
    console.warn("El botón de asignar número contable (#btn-asignar-contable) no existe en el DOM.");
    return;
  }

  btnAsignarContable.addEventListener("click", () => {
    const seleccionados = Array.from(document.querySelectorAll("#tabla-registros tbody input[type='checkbox']:checked"))
      .map((checkbox) => checkbox.value);

    if (seleccionados.length === 0) {
      alert("Por favor, selecciona al menos un registro para asignar un número contable.");
      return;
    }

    console.log("IDs seleccionados para asignar:", seleccionados);

    fetch("/api/payments/assign-auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: seleccionados }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            console.error("Error del servidor:", errorText);
            throw new Error(errorText);
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message || "Número contable asignado automáticamente correctamente.");
        cargarRegistrosVisualizacion(); // Recargar la tabla
      })
      .catch((error) => {
        console.error("Error al asignar número contable automáticamente:", error);
        alert(error.message || "Ocurrió un error al asignar el número contable. Por favor, intenta nuevamente.");
      });
  });
}

function cargarRegistrosVisualizacion() {
  const tablaRegistros = document.querySelector("#tabla-registros tbody");
  if (!tablaRegistros) {
    console.warn("La tabla de registros (#tabla-registros) no existe en el DOM.");
    return;
  }

  fetch("/api/payments")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los registros.");
      }
      return response.json();
    })
    .then((data) => {
      tablaRegistros.innerHTML = ""; // Limpiar la tabla

      if (data.length === 0) {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td colspan="9">No se encontraron registros.</td>`;
        tablaRegistros.appendChild(fila);
        return;
      }

      data.forEach((registro) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td><input type="checkbox" value="${registro.id}"></td>
          <td>${registro.compania || "N/A"}</td>
          <td>${registro.fecha || "N/A"}</td>
          <td>${registro.jornada || "N/A"}</td>
          <td>${registro.categoria || "N/A"}</td>
          <td>${registro.subdivision || "N/A"}</td>
          <td>${registro.valor || "N/A"}</td>
          <td>${registro.banco || "N/A"}</td>
          <td>${registro.registroContable || "Sin asignar"}</td>
        `;
        tablaRegistros.appendChild(fila);
      });
    })
    .catch((error) => {
      console.error("Error al cargar los registros:", error);
      alert("Ocurrió un error al cargar los registros. Por favor, intenta nuevamente.");
    });
  }
});