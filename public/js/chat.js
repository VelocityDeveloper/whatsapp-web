let Scrollbar = window.Scrollbar;
var options = {
	alwaysShowTracks: true,
};

Scrollbar.init(document.querySelector(".area-kontak"));

(function ($) {
	$(document).ready(function () {
		const socket = io();
		const localData = JSON.parse(localStorage.getItem("curentchat"));
		const localNomor = localData?.nomor;
		const localId = localData?.id;
		const localNama = localData?.nama;

		// init kontak
		socket.emit("updateDataContact", "request Data Kontak 1");

		if (localNomor && localId) {
			socket.emit("getchatbyid", localNomor);
			socket.emit("reqPicUrl", localId);
			$(".pic-current").attr("data-user", localId);
			$(".current-name").html(localNama);
		}
		$(".body-message").keypress(function (e) {
			if (e.which == 13) {
				$(".kirim-chat").submit();
				e.preventDefault();
			}
		});
		$(document).on("click", ".list-contact", function () {
			$(".list-contact").removeClass("active");
			$(".kirim-chat .body-message").val("");
			$(this).addClass("active");
			let nomor = $(this).data("nomor");
			let id = $(this).data("id");
			let nama = $(this).data("nama");
			let dataUser = {
				id: id,
				nomor: nomor,
				nama: nama,
			};
			localStorage.setItem("curentchat", JSON.stringify(dataUser));

			// getchatbyid
			socket.emit("getchatbyid", nomor);

			$(".pic-current").attr("data-user", id);
			$(".current-name").html(nama);
			$(".chatarea").html("");
			socket.emit("reqPicUrl", id);
		});

		$(document).on("keyup", ".search-form input", function () {
			var value = $(this).val();
			$(".list-contact").removeClass("d-none");
			var filter = $(this).val().toLowerCase(); // get the value of the input, which we filter on
			if (value.length > 1) {
				$(".list-contact").each(function (i, obj) {
					$(this).addClass("d-none");
					if ($(this).attr("class").toString().indexOf(filter) > 1) {
						$(this).removeClass("d-none");
					}
				});
			}
		});

		//$(document).on("change", ".#lampiran", function () {
		//    const lampiran = $(this).val();
		//    console.log(lampiran);
		//});

		$(".kirim-chat").submit(function (event) {
			const localData = JSON.parse(localStorage.getItem("curentchat"));
			const localNomor = localData?.nomor;
			const localId = localData?.id;
			const localNama = localData?.nama;
			let message = $(this).find(".body-message").val();
			socket.emit("sentMessage", { nomor: localNomor, message: message });
			socket.emit("updateDataContact", "request Data Kontak 2");
			$(".kirim-chat .body-message").val("");
			event.preventDefault();
		});

		socket.on("message", function (msg) {
			$(".logs").prepend($('<li class="list-group-item">').text(msg));
		});

		socket.on("getPicUrl", function (msg) {
			if (msg.url) {
				$(`[data-user='` + msg.data + `']`).attr("src", msg.url);
			} else {
				$(`[data-user='` + msg.data + `']`).attr("src", "/img/whatsapp.png");
			}
		});

		socket.on("getMedia", function (msg) {
			const downloadicon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-arrow-down-fill" viewBox="0 0 16 16">
                                    <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 6.854-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5a.5.5 0 0 1 1 0v3.793l1.146-1.147a.5.5 0 0 1 .708.708z"/>
                                    </svg>`;
			const img = ["jpg", "jpeg", "png", "gif", "webp"];
			const audio = ["ogg", "mp3", "oga"];
			const video = ["mp4"];
			if (img.includes(msg.ext)) {
				$('[data-media="' + msg.key + '"]').html(
					'<img src="/download/' + msg.name + '" alt="">'
				);
			} else if (video.includes(msg.ext)) {
				$('[data-media="' + msg.key + '"]').html(
					`
                <video width="320" controls>
                <source src="/download/` +
						msg.name +
						`" type="video/mp4">
                Your browser does not support the video tag.
                </video>`
				);
			} else if (audio.includes(msg.ext)) {
				$('[data-media="' + msg.key + '"]').html(
					`
                <audio controls>
                <source src="/download/` +
						msg.name +
						`" type="video/mp4">
                Your browser does not support the video tag.
                </audio>`
				);
			} else {
				$('[data-media="' + msg.key + '"]').html(
					'<a class="btn btn-dark" href="/download/' +
						msg.name +
						'" download>' +
						downloadicon +
						" " +
						msg.name +
						"</a>"
				);
			}
		});

		socket.on("getContact", function (data) {
			if (data) {
				$(".chat").html("");
				const dataListChat = data.sort();
				var arrayLength = dataListChat.length;
				for (var i = 0; i < arrayLength; i++) {
					let dataContact = dataListChat[i]?.data;
					socket.emit("reqPicUrl", dataContact.id);

					let unix_timestamp = dataContact.timestamp;
					// Create a new JavaScript Date object based on the timestamp
					// multiplied by 1000 so that the argument is in milliseconds, not seconds.
					var date = new Date(unix_timestamp * 1000);

					var year = date.getFullYear();
					var month = date.getMonth();
					var day = date.getDay();
					var hours = date.getHours();
					var minutes = "0" + date.getMinutes();
					var seconds = "0" + date.getSeconds();

					// Will display time in 10:30:23 format
					var formattedTime =
						day +
						"/" +
						month +
						"/" +
						year +
						" " +
						hours +
						":" +
						minutes.substr(-2) +
						":" +
						seconds.substr(-2);

					//Do something
					let contact = ``;
					contact += `<div class="row card-contact">`;
					contact +=
						`<div class="col-2 px-0">
                                    <img class="rounded-circle img-fluid" data-user="` +
						dataContact.id +
						`" src="" alt="">
                                    </div>
                                    <div class="col-10">
                                    <div class="ms-2 me-auto">
                                    <div class="data-nama">` +
						dataContact.name +
						`</div>
                                    <div style="font-size:8px;">` +
						formattedTime +
						`</div>
                                </div>`;
					if (dataContact.unreadCount < 0) {
						contact += `<span class="badge bg-success rounded-pill text-success">!</span>`;
					} else if (dataContact.unreadCount >= 1) {
						contact +=
							`<span class="badge bg-success rounded-pill">` +
							dataContact.unreadCount +
							`</span>`;
					}
					contact += `</div>`;
					contact += `</div>`;

					$(".chat").append(
						$(
							'<li class="text-white bg-dark list-contact list-' +
								dataContact.nomor +
								" " +
								dataContact.name.toLowerCase() +
								' list-group-item align-start" data-id="' +
								dataContact.id +
								'" data-nomor="' +
								dataContact.nomor +
								'" data-nama="' +
								dataContact.name +
								'"></li>'
						).html(contact)
					);
				}
				if (localNomor) {
					$(".list-" + localNomor).addClass("active");
				}
			}
		});

		socket.on("sentMessageSuccess", function (data) {
			$(".body-message").val("");
		});

		socket.on("getChatByNumber", function (data) {
			const localData = JSON.parse(localStorage.getItem("curentchat"));
			const localNomor = localData?.nomor;
			const localId = localData?.id;
			const localNama = localData?.nama;
			let html = "";
			if ([data.from, data.to].includes(localId)) {
				const value = data;
				let divClass = value.fromMe == true ? "chat-to" : "chat-from";
				html += '<div class="' + divClass + '"><span>';

				if (value.hasMedia) {
					html += `<div data-media="` + value.mediaKey + `"></div>`;
				} else {
					html += value.body;
				}

				html +=
					'<div><small style="font-size:8px;">' +
					value.timestamp +
					"</small></div>";
				html += "</span></div>";
				$(".chatarea").append(html);
			}
		});

		socket.on("qr", function (src) {
			$("#qrcode").attr("src", src);
			$("#qrcode").show();
		});

		socket.on("ready", function (data) {
			$("#qrcode").hide();
		});

		socket.on("authenticated", function (data) {
			$("#qrcode").hide();
		});
		socket.on("log", function (data) {
			console.log(data);
		});
	});
})(jQuery);
