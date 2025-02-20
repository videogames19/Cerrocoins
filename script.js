// ====================
// CONFIGURACIÓN DE FIREBASE
// ====================
var firebaseConfig = {
  apiKey: "AIzaSyBAIy7HjBXxKZDydBGkW1Fv8E8xcRNm7mk",
  authDomain: "cerrocoins.firebaseapp.com",
  projectId: "cerrocoins",
  storageBucket: "cerrocoins.firebasestorage.app",
  messagingSenderId: "466158874351",
  appId: "1:466158874351:web:00f10897a2f6f90eb7751a"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

// ====================
// VARIABLES GLOBALES
// ====================
let currentUser = null;
let userData = null; // { cerrocoins: Number, portfolio: { "Empresa A": Number, ... }, username: String }

// ====================
// AUTENTICACIÓN
// ====================
document.getElementById("signupBtn").addEventListener("click", signUp);
document.getElementById("loginBtn").addEventListener("click", logIn);
document.getElementById("logoutBtn").addEventListener("click", logOut);
document.getElementById("transferBtn").addEventListener("click", transferCoins);

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    refreshUserData();
  } else {
    currentUser = null;
    userData = null;
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

function signUp() {
  const usernameInput = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!usernameInput || !password) {
    document.getElementById("authMessage").textContent = "Ingresa un nombre de usuario y contraseña.";
    return;
  }
  // Simulamos un email a partir del nombre de usuario
  const email = usernameInput + "@cerrocoin.com";
  
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(cred => {
      return db.collection("users").doc(cred.user.uid).set({
        username: usernameInput,
        cerrocoins: 5,
        portfolio: {}
      });
    })
    .then(() => {
      document.getElementById("authMessage").textContent = "Registrado correctamente.";
    })
    .catch(error => {
      document.getElementById("authMessage").textContent = error.message;
    });
}

function logIn() {
  const usernameInput = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!usernameInput || !password) {
    document.getElementById("authMessage").textContent = "Ingresa un nombre de usuario y contraseña.";
    return;
  }
  const email = usernameInput + "@cerrocoin.com";
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("authMessage").textContent = "";
    })
    .catch(error => {
      document.getElementById("authMessage").textContent = error.message;
    });
}

function logOut() {
  firebase.auth().signOut();
}

// ====================
// OBTENCIÓN Y ACTUALIZACIÓN DE DATOS DEL USUARIO
// ====================
function refreshUserData() {
  db.collection("users").doc(currentUser.uid).get()
    .then(doc => {
      if (doc.exists) {
        userData = doc.data();
        renderApp();
      }
    })
    .catch(error => {
      console.error("Error al obtener datos del usuario:", error);
    });
}

function renderApp() {
  renderBalance();
  renderMarket();
  renderPortfolio();
}

function renderBalance() {
  document.getElementById("cerrocoins").textContent = parseFloat(userData.cerrocoins).toFixed(2);
}

function renderMarket() {
  const marketList = document.getElementById("market-list");
  marketList.innerHTML = "";
  
  companies.forEach(company => {
    const price = getPrice(company);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${company}</td>
      <td>${price}</td>
      <td>
        <button onclick="buy('${company}')">Comprar</button>
        <button class="sell" onclick="sell('${company}')">Vender</button>
      </td>
    `;
    marketList.appendChild(row);
  });
}

function renderPortfolio() {
  const portfolioList = document.getElementById("portfolio-list");
  portfolioList.innerHTML = "";
  
  for (const company in userData.portfolio) {
    const shares = userData.portfolio[company];
    if (shares > 0) {
      const price = getPrice(company);
      const totalValue = (shares * price).toFixed(2);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${company}</td>
        <td>${shares}</td>
        <td>${totalValue}</td>
      `;
      portfolioList.appendChild(row);
    }
  }
}

// ====================
// FUNCIONES DE COMPRA Y VENTA
// ====================
function buy(company) {
  const price = parseFloat(getPrice(company));
  if (userData.cerrocoins >= price) {
    userData.cerrocoins = parseFloat(userData.cerrocoins) - price;
    userData.portfolio[company] = (userData.portfolio[company] || 0) + 1;
    updateUserDoc();
  } else {
    alert("No tienes suficientes Cerrocoins para comprar.");
  }
}

function sell(company) {
  if (userData.portfolio[company] && userData.portfolio[company] > 0) {
    const price = parseFloat(getPrice(company));
    userData.cerrocoins = parseFloat(userData.cerrocoins) + price;
    userData.portfolio[company]--;
    if (userData.portfolio[company] === 0) {
      delete userData.portfolio[company];
    }
    updateUserDoc();
  } else {
    alert("No tienes acciones de esta empresa para vender.");
  }
}

function updateUserDoc() {
  db.collection("users").doc(currentUser.uid).update({
    cerrocoins: userData.cerrocoins,
    portfolio: userData.portfolio
  })
  .then(() => {
    renderApp();
  })
  .catch(error => {
    console.error("Error al actualizar el documento:", error);
  });
}

// ====================
// TRANSFERENCIA DE CERROCOINS ENTRE USUARIOS
// ====================
function transferCoins() {
  const recipientUsername = document.getElementById("transferUsername").value.trim();
  const amount = parseFloat(document.getElementById("transferAmount").value);
  const transferMessage = document.getElementById("transferMessage");
  
  if (!recipientUsername || isNaN(amount) || amount <= 0) {
    transferMessage.textContent = "Ingresa un nombre de usuario válido y una cantidad mayor a 0.";
    return;
  }
  if (userData.cerrocoins < amount) {
    transferMessage.textContent = "No tienes suficientes Cerrocoins para transferir.";
    return;
  }
  
  // Buscar al destinatario por nombre de usuario
  db.collection("users").where("username", "==", recipientUsername).get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        transferMessage.textContent = "Usuario no encontrado.";
        return;
      }
      const recipientDoc = querySnapshot.docs[0];
      const recipientRef = recipientDoc.ref;
      const senderRef = db.collection("users").doc(currentUser.uid);
      
      // Transferencia atómica usando transacción
      return db.runTransaction(async (transaction) => {
        // Primero obtenemos los datos del remitente y destinatario
        const senderDocSnap = await transaction.get(senderRef);
        const recipientDocSnap = await transaction.get(recipientRef);

        const senderBalance = parseFloat(senderDocSnap.data().cerrocoins);
        const recipientBalance = parseFloat(recipientDocSnap.data().cerrocoins);

        if (senderBalance < amount) {
          throw "Saldo insuficiente para la transferencia.";
        }

        // Realizamos las escrituras después de las lecturas
        transaction.update(senderRef, { cerrocoins: senderBalance - amount });
        transaction.update(recipientRef, { cerrocoins: recipientBalance + amount });
      });
    })
    .then(() => {
      transferMessage.textContent = "Transferencia realizada con éxito.";
      refreshUserData();
    })
    .catch(error => {
      transferMessage.textContent = "Error en la transferencia: " + error;
    });
}

