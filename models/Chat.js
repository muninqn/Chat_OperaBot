// import { URLs, bodyParser } from "../configs/services";
const services = require("../configs/servicesConfig");
const axios = require("axios").default;
const estado = require("./Estado"); // estado.js exporta las clases 'Abierto' y 'Cerrado'
// const OperaDB = require("../dbService");
/**
 *
 *
 * @class Chat
 */
class Chat {
  // * chat.id;           -> Posiblemente el mismo que usen F o W
  // * chat.timestamp;    -> Ultimo timestamp, puede ser local o la que traiga original
  // * chat.lastmessage;  -> Ultimo mensaje, para mantener una verificación de actualizacion
  // * chat.origin;       -> Origen 'F' o 'W'
  // * chat.name;         -> Nombre para mostrar / humano legible
  // ? chat.avatar;       -> Tal vez sea necesario usar las fotos de perfil o avatares para mejor usabilidad
  // ? chat.estado        -> Para llevar control de los estados de una conversacion
  /**
   *Creates an instance of Chat.
   * @param {*} id remitente del chat, igual que el original que usan las plataformas
   * @param {*} origen (W)hatsapp, (F)acebook...
   * @param {*} name nombre humano-legible del remitente
   * @param {*} timestamp ultima marca de tiempo
   * @param {*} pendingmessage cantidad de mensajes sin leer
   * @param {*} lastmessage contenido del ultmo mensaje (para que exista un chat, al menos un mensaje hubo)
   * @param {*} email contenido del email del usuario si es que lo ingreso
   * @memberof Chat
   */
  constructor(
    id,
    origen,
    name,
    timestamp,
    pendingmessage = 0,
    lastmessage = "",
    email
  ) {
    this.id = id;
    this.origin = origen;
    this.name = name;
    this.lastmessage = lastmessage;
    this.pendingmessage = pendingmessage;
    this.timestamp = timestamp;
    this.email = email;
    this.state = new estado.Abierto(this.id);
    // this.db = new OperaDB();
  }

  static async getAll() {
    let res = {};
    let promises = [];
    let urls = Object.values(services.URLs).map((url) => url + "/list");
    for (let i = 0; i < urls.length; i++) {
      promises.push(axios.get(urls[i]));
    }

    const sendGetRequest = async () => {
      try {
        await Promise.allSettled(promises).then(
          axios.spread((...responses) => {
            let i = 0;
            responses.forEach((response) => {
              if (response.value !== undefined) {
                let chat_temp;
                response.value.data.forEach((chat) => {
                  chat_temp = services.chatParser(
                    Object.keys(services.URLs)[i],
                    chat
                  );
                  res[chat_temp.id] = new Chat(
                    chat_temp.id,
                    chat_temp.origin,
                    chat_temp.name,
                    chat_temp.timestamp,
                    chat_temp.pendingmessage,
                    chat_temp.email,
                    undefined
                  );
                });
              }
              i += 1;
            });
          }),
          (error) => {
            // TODO: Fallo un servicio de mensajeria, reportar
            console.error(error);
          }
        );
      } catch (err) {
        // TODO: Handle Error Here
        console.error(err);
      }
    };
    await sendGetRequest();
    return res;
  }

  async enviarMensaje(cont) {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/sendmessage", {
        body: services.bodyParser(this.origin, this.id, cont),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        res = response.data;
        // Actualizamos el estado interno del chat
        this.pendingmessage = 0;
        this.lastmessage = cont;
        this.timestamp = Date.now();
      })
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }

  async enviarArchivo(cont) {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/newfiles", {
        body: services.bodyParser(this.origin, this.id, cont),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        res = response.data;
        // Actualizamos el estado interno del chat
        this.pendingmessage = 0;
        this.lastmessage = cont;
        this.timestamp = Date.now();
      })
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }


  async enviarMenu(cont) {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/menuoperador", {
        body: services.bodyParser(this.origin, this.id, cont),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        res = response.data;
        // Actualizamos el estado interno del chat
        this.pendingmessage = 0;
        this.lastmessage = cont;
        this.timestamp = Date.now();
      })
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }


   async modificarMenu(cont) {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/modificarOpciones", {
        body: services.bodyParser(this.origin, this.id, cont),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        res = response.data;
        // Actualizamos el estado interno del chat
        this.pendingmessage = 0;
        this.lastmessage = cont;
        this.timestamp = Date.now();
      })
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }

  async enviarEstado(cont) {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/sendstatus", {
        body: { id: this.id, text: cont },
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(
        (response) => {
          res = response.data;
          console.log(res);
          //? Actualizamos el estado interno del chat
        },
        (err) => {
          // TODO: volver a emitir?
          console.log(err);
        }
      )
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }

  async getAllMessages(includeMe) {
    let res;
    let b = services.getMessagesParser(this.origin, this.id, includeMe);
    // let b = JSON.stringify({
    //   id: this.id,
    //   includeMe: includeMe,
    // });
    const sendRequest = async () => {
      try {
        await axios
          .post(services.URLs[this.origin] + "/getallmessages", {
            body: b,
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            res = services.messagesParser(this.origin, response.data);
          });
      } catch (err) {
        // Handle Error Here
        console.error(err);
      }
    };
    await sendRequest();
    res = res.sort(function (a, b) {
      return a.timestamp - b.timestamp;
    });
    return res;
  }

  async seen() {
    let res;
    await axios
      .post(services.URLs[this.origin] + "/seen", {
        body: { id: this.id, text:'' },
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(
        (response) => {
          res = response.data;
          this.pendingmessage = 0;
          console.log(res);
        },
        (err) => {
          // TODO: volver a emitir?
          console.log(err);
        }
      )
      .catch(function (error) {
        res = new Error(error);
      });
    return res;
  }

  async getMoreMessages() {
    let res;
    let b = JSON.stringify({
      id: this.id,
    });
    const sendRequest = async () => {
      try {
        await axios
          .post(services.URLs[this.origin] + "/getmoremessages", {
            body: b,
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            res = response.data;
          });
      } catch (err) {
        // Handle Error Here
        console.error(err);
      }
    };
    await sendRequest();
    // res = res.sort(function (a, b) {
    //   return a.timestamp - b.timestamp;
    // });
    // return res;
  }

  changeState(state) {
    this.state = state;
  }

  // funcionalidad para modificar el estado del chat
  asignacion() {
    this.state.asignacion();
  }

  // funcionalidad para modificar el estado del chat
  resolucionOk() {
    this.state.resolucionOk();
  }

  // funcionalidad para modificar el estado del chat
  resolucionFallida() {
    this.state.resolucionFallida();
  }
}

module.exports = Chat;
