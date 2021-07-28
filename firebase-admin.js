var admin = require("firebase-admin");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
	path: "users.csv",
	header: [
		{ id: "name", title: "Name" },
		{ id: "email", title: "Email" },
		{ id: "school", title: "School" },
		{ id: "score", title: "Score" },
	],
});

var serviceAccount = require("./secret.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://hour-of-code-hcpss-default-rtdb.firebaseio.com",
});

var db = admin.database();

const data = [];

const listAllUsers = async (nextPageToken) => {
	await admin
		.auth()
		.listUsers(1000, nextPageToken)
		.then((listUsersResult) => {
			listUsersResult.users.forEach(async (userRecord) => {
				var ref = await db.ref("users/" + userRecord.uid);
				await ref.once("value", function (snapshot) {
					try {
						const d = snapshot.val();
						const score = d.score[0] + d.score[1] + d.score[2];
						const line =
							userRecord.displayName + "   " + d.school + "   " + score;
						data.push({
							name: userRecord.displayName,
							email: userRecord.email,
							school: d.school,
							score: score,
						});
					} catch {
						data.push({
							name: userRecord.displayName,
							email: userRecord.email,
							school: "",
							score: "",
						});
					}
				});
			});
			if (listUsersResult.pageToken) {
				listAllUsers(listUsersResult.pageToken);
			}
		})
		.catch((error) => {
			console.log("Error listing users:", error);
		});
};
listAllUsers();
setTimeout(() => {
	csvWriter
		.writeRecords(data)
		.then(() => console.log("The CSV file was written successfully"));
}, 500000);
