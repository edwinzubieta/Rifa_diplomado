import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

// 1. Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFzzIplxCNJ03Y9cKpUgcourRSEbi2fLg",
  authDomain: "rifa-diplomado.firebaseapp.com",
  projectId: "rifa-diplomado",
  storageBucket: "rifa-diplomado.firebasestorage.app",
  messagingSenderId: "1034226905098",
  appId: "1:1034226905098:web:5a183fe48b94dd96b4eff3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM
const gridContainer = document.getElementById('grid-numeros');
const modal = document.getElementById('modal-reserva');
const cerrarModal = document.getElementById('cerrar-modal');
const spanNumeroSeleccionado = document.getElementById('numero-seleccionado');
const btnConfirmar = document.getElementById('btn-confirmar');
const inputNombre = document.getElementById('nombre-comprador');
const inputTelefono = document.getElementById('telefono-comprador');

let numeroActual = null;

// 2. Escuchar la Base de Datos en Tiempo Real
const numerosRef = collection(db, "numeros");

onSnapshot(numerosRef, (snapshot) => {
  // Limpiamos la cuadrícula para volver a pintarla con los datos frescos
  gridContainer.innerHTML = ''; 
  
  // Convertimos el snapshot a un array y lo ordenamos por ID (del "00" al "99")
  const numerosObtenidos = [];
  snapshot.forEach(doc => numerosObtenidos.push({ id: doc.id, ...doc.data() }));
  numerosObtenidos.sort((a, b) => a.id.localeCompare(b.id));

  // Pintamos cada número
  numerosObtenidos.forEach(numeroObj => {
    const div = document.createElement('div');
    div.classList.add('numero-box', numeroObj.estado);
    div.textContent = numeroObj.id;

    div.addEventListener('click', () => {
      if (numeroObj.estado === 'disponible') {
        abrirModal(numeroObj.id);
      }
    });

    gridContainer.appendChild(div);
  });
});

// 3. Lógica del Modal
function abrirModal(idNumero) {
  numeroActual = idNumero;
  spanNumeroSeleccionado.textContent = idNumero;
  modal.classList.remove('oculto');
}

cerrarModal.addEventListener('click', () => {
  modal.classList.add('oculto');
  inputNombre.value = '';
  if (inputTelefono) inputTelefono.value = '';
});

btnConfirmar.addEventListener('click', async () => {
  const nombre = inputNombre.value.trim();
  const telefono = inputTelefono ? inputTelefono.value.trim() : '';

  if (nombre === '') {
    alert('Por favor, ingresa tu nombre');
    return;
  }

  // Actualizamos el estado en Firebase
  const numeroDocRef = doc(db, "numeros", numeroActual);
  await updateDoc(numeroDocRef, {
    estado: 'reservado',
    comprador: nombre,
    telefono: telefono
  });

  // --- NUEVO: Redirección automática a WhatsApp ---
  // Reemplaza este número con el tuyo. Deja el 57 que es el indicativo de Colombia.
  const miNumeroWhatsApp = '573208095858'; 
  
  // Mensaje predeterminado que te llegará
  const mensaje = `Hola Edwin, acabo de separar el número ${numeroActual} para la rifa de tu diplomado. Mi nombre es ${nombre}. ¿Me compartes tu Nequi o Daviplata para transferirte?`;
  
  // Codificamos el mensaje para que la URL lo entienda (respete los espacios)
  const urlWhatsApp = `https://wa.me/${miNumeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

  // Cerramos el modal y limpiamos los inputs
  modal.classList.add('oculto');
  inputNombre.value = '';
  if (inputTelefono) inputTelefono.value = '';
  
  // Redirigimos al usuario a WhatsApp en una nueva pestaña
  window.open(urlWhatsApp, '_blank');
});

// --- FUNCIÓN DE INICIALIZACIÓN ---
// Crea los 100 documentos en Firestore si la base de datos está vacía
async function sembrarBaseDeDatos() {
  const docRef = doc(db, "numeros", "00");
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    console.log("Creando números en la base de datos...");
    for (let i = 0; i < 100; i++) {
      const idStr = String(i).padStart(2, '0');
      await setDoc(doc(db, "numeros", idStr), {
        estado: "disponible",
        comprador: "",
        telefono: ""
      });
    }
    console.log("¡Base de datos lista!");
  }
}

sembrarBaseDeDatos();