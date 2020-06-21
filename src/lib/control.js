
import {
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  currentUser,
  promiseOfSetFirebase,
  promiseOfgetFirebase,
  promiseOfdeleteFirebase,
  promiseOfUpdateFirebase,
  promiseOnSnapshotFirebase,
  firebaseAuthState,
  promiseOfAddFirebase,
  getUrlImageFromStorage,
} from "./firebase.js";

const changeHash = (hash) => {
  location.hash = hash;
};

const ingresarClick = (email, password) => {
  if (email === "" || password === "") {
    alert("Completa tus datos para ingresar");
  } else {
    signIn(email, password)
      .then((cred) => {
        changeHash("#/user-profile");
      })
      .catch((error) => {
        // Handle Errors here.
        let errorCode = error.code;
        let errorMessage = error.message;
        console.log(errorMessage);
        if (errorCode == "auth/weak-password") {
          alert("Tu contraseña es débil Padawan");
        } else if (errorCode == "Ya existe esta cuenta") {
          alert("Ya existe esta cuenta");
        } else if (errorCode == "tu correo electrónico es inválido Padawan") {
          alert("tu correo electrónico es inválido Padawan");
        } else if (errorCode == "La dirección de correo electrónico es inválida Padawan") {
          alert("La dirección de correo electrónico es inválida Padawan");
        } else {
          alert(
            "fuiste eliminado, tal vez te uniste al lado oscuro de la fuerza Padawan"
          );
        }
        console.log(error);
      });
  }
};

const registrarClick = (email2, password2, userName) => {
  if (email2 === "" || password2 === "" || userName === "") {
    alert("Completa tus datos para registrarte Padawan");
  } else {
    signUp(email2, password2).then(() => {
      let user = currentUser();
      return promiseOfSetFirebase("users", user.uid, {
        name: userName,
        photo:
          "https://icons-for-free.com/iconfiles/png/512/r2d2+robot+starwars+icon-1320166698566079188.png",
        userId: user.uid,
        email: email2,
      }).then(() => {
        const form = document.querySelector("#register-form");
        form.reset();
        alert("Registrado exitosamente");
        signOut();
      });
    });
  }
};

const ingresarGoogleClick = () => {
  signInWithGoogle()
    .then((result) => {
      changeHash("#/user-profile");
      let token = result.credential.accessToken;
      let user = result.user; 
      console.log(token);
      const userName = user.displayName;
      const userEmail = user.email;
      const userPhoto = user.photoURL;
      const idUser = user.uid;
      return promiseOfSetFirebase("users", idUser, {
        name: userName,
        userId: idUser,
        email: userEmail,
        photo: userPhoto,
      });
    })
    .catch((error) => {
      let errorCode = error.code;
      let errorMessage = error.message;
      if (errorCode == "auth/weak-password") {
        alert("La fuerza no acompaña a tu contraseña (es debíl");
      } else {
        alert(errorMessage);
      }
      console.log(error);
    });
};
const cerrarSesionUsuario = () => {
  signOut();
};

//Funcion que retorna la data del usuario (documento con el id del usuario)
const obtenerDatosUsuario = (uid) => {
  return promiseOfgetFirebase("users", uid)
    .then((doc) => {
      // console.log(doc.data()
      return doc.data(); // retorna una promesa
    })
    .catch((error) => {
      console.log("Error getting document:", error);
    });
};

const eliminarPostAlClick = (idPost, idUserOfPost) => {
  const uidOfCurrentUser = currentUser().uid; // id del usuario logueado actual
  console.log(uidOfCurrentUser); // id del usuario logueado actual
  console.log(idUserOfPost); // id del usuario  dentro del objeto post
  console.log(idPost); // id del post
  if (uidOfCurrentUser === idUserOfPost) {
    promiseOfdeleteFirebase("posts", idPost)
      .then(() => {
        console.log("Document successfully deleted!");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
  } else {
    alert("No puedes eliminar un comentario que no sea tuyo Padawan");
  }
};

const editarPostEnFirestore = (idPost, idUserOfPost, commentInputNewValue) => {
  const uidOfCurrentUser = currentUser().uid; // id del usuario logueado actual
  console.log(idPost); // id del post
  if (uidOfCurrentUser === idUserOfPost) {
    promiseOfUpdateFirebase("posts", idPost, {
      content: commentInputNewValue,
    })
      .then(() => {
        console.log("Document successfully updated!");
      })
      .catch((error) => {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
  } else {
    alert("No puedes editar un comentario que no sea tuyo Padawan");
  }
};

const getPostsInRealtime = (callback) => {
  promiseOnSnapshotFirebase("posts", (arrOfAllPosts) => {
    let arrOfPosts = [];
    arrOfAllPosts.forEach((onePost) => {
      arrOfPosts.push({ id: onePost.id, ...onePost.data() });
    });
    callback(arrOfPosts);
  });
};
// usuario activo
const getUserActive = (callback) => {
  //printUserinfo()
  if (currentUser()) {
    // si el usuario ha iniciado sesion y existe un current user
    callback(currentUser()); // printUserinfo() recibe al usuario actual
  } else {
    // si el usuario recarga la pagina ,se activa un observador para saber el estado del usuario
    const unsuscribe = firebaseAuthState((user) => {
      if (user) {
        // si se verifica que existe un current user
        callback(user); // printUserInfo recibe al usuario actual
      } else {
        // si no existe un current user
        unsuscribe(); //entonces se desactiva el observador  //
      }
    });
  }
};
const addPostToCloudFirestore = (
  inputComment,
  idUser,
  statusComment,
  photo
) => {
  const f = new Date();
  let fecha = f.getDate() + "-" + (f.getMonth() + 1) + "-" + f.getFullYear();
  promiseOfAddFirebase("posts", {
    hours: f.getHours() + ":" + f.getMinutes(),
    today: fecha,
    content: inputComment,
    userId: idUser,
    state: statusComment,
    likes: "",
    photoPost: photo,
  })
    .then((docRef) => {
      console.log(docRef);
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
};

const manejarInfoEnviada = (
  inputComment,
  idUser,
  statusComment,
  /* progress, */ selectedFile
) => {
  if (selectedFile !== undefined) {
    getUrlImageFromStorage(
      selectedFile,
      /* progress, */ (url) => {
        addPostToCloudFirestore(inputComment, idUser, statusComment, url);
      }
    );
  } else {
    addPostToCloudFirestore(inputComment, idUser, statusComment, "");
  }
};

const editarPerfil = (name1, age1, sex1, birthCountry, userId1) => {
  promiseOfUpdateFirebase("users", userId1, {
    name: name1,
    age: age1,
    sex: sex1,
    country: birthCountry,
  })
    .then(() => {
      console.log("Document successfully updated!");
    })
    .catch((error) => {
      // The document probably doesn't exist.
      console.error("Error updating document: ", error);
    });
};

export const postLike = (id) => {
  const user = firebase.auth().currentUser;
  console.log(id)

  // de la collection post traeme el documento con el ID, "id"
  promiseOfgetFirebase('posts', id)
  .then((respuesta) => {
    const post = respuesta.data();
    if (post.likes == null || post.likes == '') {
      post.likes = [];
      // eslint-disable-next-line no-console
      console.log('entró al like vacio');
    }

    if (post.likes.includes(user.uid)) {
      for (let i = 0; i < post.likes.length; i++) {
        if (post.likes[i] === user.uid) { // verifica si ya el usuario está en el array
          post.likes.splice(i, 1); // sentencia para eliminar un elemento de un array
          promiseOfUpdateFirebase('posts', id ,{likes: post.likes})
        }}   
        } else {
          post.likes.push(user.uid);
          promiseOfUpdateFirebase('posts', id ,{likes: post.likes})
    }
  })
  .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(error.message);
    });
}

export {
  ingresarClick,
  registrarClick,
  ingresarGoogleClick,
  cerrarSesionUsuario,
  obtenerDatosUsuario,
  getUserActive,
  eliminarPostAlClick,
  editarPostEnFirestore,
  getPostsInRealtime,
  editarPerfil,
  manejarInfoEnviada,
};
