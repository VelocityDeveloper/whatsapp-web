const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const mime = require("mime-types");
const path = require("path");
const { body, validationResult } = require("express-validator");

const { engine } = require("express-handlebars");

const { phoneNumberFormatter } = require("./helpers/formatter");
const fileUpload = require("express-fileupload");

const auth = require("./routes/auth");
const user = require("./routes/user");

const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const authConfig = require("./config/authConfig");

const port = process.env.PORT || 8000;

const app = express();

const server = http.createServer(app);
const io = socketIO(server);

dotenv.config({
	path: "./.env",
});
const db = mysql.createConnection({
	host: process.env.MYSQL_HOST,
	database: process.env.MYSQL_NAME,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASS,
});

var handlebars = require("express-handlebars").create({
	layoutsDir: path.join(__dirname, "views/layouts"),
	partialsDir: path.join(__dirname, "views/partials"),
	defaultLayout: "main",
	extname: "hbs",
});

app.engine("hbs", handlebars.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

db.connect((error) => {
	if (error) {
		console.log(error);
	} else {
		console.log("MYSQL connected...");
	}
});

app.use(cookieParser());
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(
	express.urlencoded({
		extended: false,
	})
);

// login mania
// Middlewares
app.use(
	session({
		name: "session-id",
		secret: "scret",
		saveUninitialized: false,
		resave: false,
		cookie: {
			expires: 600000,
		},
	})
);

// Passport
app.use(passport.initialize());
app.use(passport.session());
authConfig(passport);

// Routes
app.use("/auth", auth);
app.use("/user", user);

/**
 * BASED ON MANY QUESTIONS
 * Actually ready mentioned on the tutorials
 *
 * Many people confused about the warning for file-upload
 * So, we just disabling the debug for simplicity.
 */
app.use(
	fileUpload({
		debug: false,
	})
);

// Define Routes
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));

app.use(express.static("public"));

const client = new Client({
	restartOnAuthFail: true,
	puppeteer: {
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--single-process", // <- this one doesn't works in Windows
			"--disable-gpu",
		],
	},
	authStrategy: new LocalAuth(),
});
client.initialize();

client.on("message", (msg) => {
	if (msg.body == "ping") {
		msg.reply("Pesan ini dibalas oleh bot!");
	} else if (msg.body == "good morning") {
		msg.reply("selamat pagi");
	} else if (msg.body == "!groups") {
		client.getChats().then((chats) => {
			const groups = chats.filter((chat) => chat.isGroup);

			if (groups.length == 0) {
				msg.reply("You have no group yet.");
			} else {
				let replyMsg = "*YOUR GROUPS*\n\n";
				groups.forEach((group, i) => {
					replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
				});
				replyMsg +=
					"_You can use the group id to send a message to the group._";
				msg.reply(replyMsg);
			}
		});
	}
});

// Socket IO
io.on("connection", function (socket) {
	client.on("qr", (qr) => {
		console.log("QR RECEIVED", qr);
		qrcode.toDataURL(qr, (err, url) => {
			socket.emit("qr", url);
			socket.emit("message", "QR Code received, scan please!");
		});
	});

	client.on("authenticated", () => {
		socket.emit("authenticated", "Whatsapp is authenticated!");
		socket.emit("message", "Whatsapp is authenticated!");
		console.log("AUTHENTICATED");
	});

	client.on("auth_failure", function (session) {
		socket.emit("message", "Auth failure, restarting...");
		console.log(session);
	});

	client.on("disconnected", (reason) => {
		socket.emit("message", "Whatsapp is disconnected!");
		client.destroy();
		client.initialize();
	});

	client.on("ready", async function () {
		console.log("client ready");
	});

	socket.emit("message", "Menghububugkan...");

	if (typeof client.info?.wid !== "undefined") {
		let getContactList = async function () {
			let isChatIn = await contactInit();
			socket.emit("getContact", isChatIn);
			console.log("sent contact to frontend");
		};
		getContactList;
	} else {
		socket.emit("getContact", "Client belum siap!");
		console.log("Client belum siap!");
	}

	socket.on("getQr", async () => {
		let qr = await new Promise((resolve, reject) => {
			client.on("qr", (qr) => resolve(qr));
		});
	});

	socket.on("updateDataContact", async function (msg) {
		if (typeof client.info?.wid !== "undefined") {
			let isChatIn = await contactInit();
			socket.emit("getContact", isChatIn);
			console.log("sinkronkan kontak karena chat masuk");
			console.log(msg);
		} else {
			socket.emit("getContact", "Client belum siap!");
			console.log("Client belum siap!");
		}
	});
	socket.on("reqPicUrl", async function (data) {
		// socket.emit('log', client);
		if (typeof client.info?.wid !== "undefined") {
			let pic = await client.getProfilePicUrl(data);
			socket.emit("getPicUrl", { data: data, url: pic });
		}
	});
});

server.listen(port, function () {
	console.log("App running on *: " + port);
});

const contactInit = async function () {
	console.log("mendapatkan list chat");
	const allChats = await client.getChats();
	const obj = [];

	// console.log(allChats[0]);
	for (var i = 0, l = allChats.length; i < l; i++) {
		if (allChats[i]?.id?.user.includes("-") == false) {
			// console.log(pic);
			obj.push({
				data: {
					name: allChats[i]?.name,
					id: allChats[i]?.id?._serialized,
					nomor: allChats[i]?.id?.user,
					unreadCount: allChats[i]?.unreadCount,
					timestamp: allChats[i]?.timestamp,
				},
			});
		}
	}
	return obj;
};
