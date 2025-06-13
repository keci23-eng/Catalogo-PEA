// pedidos.js
// Lógica para mostrar y aceptar pedidos (solo admin)

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('authToken') || localStorage.getItem('rol') !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    cargarPedidos();
});

async function cargarPedidos() {
    const token = localStorage.getItem('authToken');
    const contenedor = document.getElementById('pedidos-contenido');
    const mensajeDiv = document.getElementById('pedidos-mensaje');
    contenedor.innerHTML = '<div class="text-blue-300">Cargando pedidos...</div>';
    mensajeDiv.textContent = '';
    try {
        const res = await fetch('http://127.0.0.1:8000/api/pedidos', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const pedidos = await res.json();
        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            contenedor.innerHTML = '<div class="text-blue-400">No hay pedidos registrados.</div>';
            return;
        }
        let tabla = `<table class='min-w-full text-blue-100'><thead><tr>
            <th class='px-2 py-1'>ID</th><th class='px-2 py-1'>Cliente</th><th class='px-2 py-1'>Dirección</th><th class='px-2 py-1'>Provincia</th><th class='px-2 py-1'>Teléfono</th><th class='px-2 py-1'>Total</th><th class='px-2 py-1'>Estado</th><th class='px-2 py-1'>Fecha</th><th class='px-2 py-1'>Productos</th><th class='px-2 py-1'>Acciones</th></tr></thead><tbody>`;
        pedidos.forEach(pedido => {
            let productosHtml = '<ul class="list-disc pl-4">';
            const items = pedido.pedidoProductos || pedido.pedido_productos || [];
            items.forEach(item => {
                const prod = item.producto;
                productosHtml += `<li>${prod ? prod.titulo : 'Producto eliminado'} x${item.cantidad} ($${item.precio_unitario})</li>`;
            });
            productosHtml += '</ul>';
            tabla += `<tr>
                <td class='border px-2 py-1'>${pedido.id}</td>
                <td class='border px-2 py-1'>${pedido.user ? pedido.user.name : 'N/A'}</td>
                <td class='border px-2 py-1'>${pedido.direccion ? pedido.direccion.direccion : 'N/A'}</td>
                <td class='border px-2 py-1'>${pedido.direccion ? pedido.direccion.provincia : 'N/A'}</td>
                <td class='border px-2 py-1'>${pedido.direccion ? pedido.direccion.telefono : 'N/A'}</td>
                <td class='border px-2 py-1'>$${pedido.total}</td>
                <td class='border px-2 py-1'>${pedido.estado}</td>
                <td class='border px-2 py-1'>${pedido.fecha_pedido ? pedido.fecha_pedido.substring(0, 10) : ''}</td>
                <td class='border px-2 py-1'>${productosHtml}</td>
                <td class='border px-2 py-1'>${pedido.estado === 'pendiente' ? `<button class='bg-green-600 text-white px-2 py-1 rounded aceptar-btn' data-id='${pedido.id}'>Aceptar</button>` : ''}</td>
            </tr>`;
        });
        tabla += '</tbody></table>';
        contenedor.innerHTML = tabla;
        // Eventos para aceptar pedido
        document.querySelectorAll('.aceptar-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const pedidoId = this.getAttribute('data-id');
                await aceptarPedido(pedidoId);
            });
        });
    } catch (e) {
        contenedor.innerHTML = '<div class="text-red-400">Error al cargar los pedidos.</div>';
    }
}

async function aceptarPedido(pedidoId) {
    const token = localStorage.getItem('authToken');
    const mensajeDiv = document.getElementById('pedidos-mensaje');
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/pedidos/${pedidoId}/aceptar`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (res.ok) {
            mensajeDiv.innerHTML = `<span class='text-green-400 font-bold'>Pedido aceptado correctamente.</span>`;
            cargarPedidos();
        } else {
            mensajeDiv.innerHTML = `<span class='text-red-400'>${data.message || 'Error al aceptar el pedido.'}</span>`;
        }
    } catch (e) {
        mensajeDiv.innerHTML = `<span class='text-red-400'>Error al aceptar el pedido.</span>`;
    }
}
