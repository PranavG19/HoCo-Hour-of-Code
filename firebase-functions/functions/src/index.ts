import * as functions from "firebase-functions";
import admin = require("firebase-admin");

admin.initializeApp();

const db = admin.database();

exports.checkAnswers = functions.https.onCall(async (data, context) => {
	const uid = context?.auth?.uid;
	const email = context?.auth?.token?.email;
	if (uid === (undefined || null) || (email && !email.endsWith("hcpss.org"))) {
		return false;
	}

	const questionName: string = data.questionName;
	const answers: (string | number)[] = data.answers;
	const questionNumbers: number[] = data.questionNumbers;
	const cat: number = data.cat;
	const school: string = data.school;

	const questionAnswers: number[] = [];
	for (let i = 0; i < 3; i++) {
		await db
			.ref(
				"/questions/" +
					questionName +
					"/questions/" +
					questionNumbers[i].toString() +
					"/answer"
			)
			.get()
			.then((snapshot) => {
				questionAnswers.push(snapshot.val());
			});
	}

	const isAnswerCorrect =
		answers.length === questionAnswers.length &&
		answers.every((element, index) => {
			return element == questionAnswers[index];
		});

	if (isAnswerCorrect) {
		let pts: number = data.pts;
		await db
			.ref("/questions/" + questionName + "/pts")
			.get()
			.then((snapshot) => {
				pts = snapshot.val();
			});

		let userPoints: number = data.userPoints;
		await db
			.ref("/users/" + uid + "/score")
			.get()
			.then((snapshot) => {
				const temp = snapshot.val();
				userPoints = temp[0] + temp[1] + temp[2];
			});

		const scoreRef = db.ref("users/" + uid + "/score/" + cat);
		scoreRef.set(admin.database.ServerValue.increment(pts));

		const schoolRef = db.ref("schools/" + school);
		const pRef = db.ref("p/" + school);
		if (userPoints >= 60) {
			return true;
		} else if (userPoints + pts >= 60) {
			const points: number = 60 - userPoints;
			schoolRef.set(admin.database.ServerValue.increment(points));
			pRef.set(admin.database.ServerValue.increment(points));
		} else {
			schoolRef.set(admin.database.ServerValue.increment(pts));
			pRef.set(admin.database.ServerValue.increment(pts));
		}
	}

	return isAnswerCorrect;
});

exports.createUser = functions.https.onCall(async (data) => {
	const uid: string = data.uid;
	const school: string = data.school;
	const questionLengths: number[] = [
		6, 8, 8, 8, 10, 9, 6, 10, 9, 7, 7, 7, 10, 6, 6, 6, 7, 10, 7, 6, 7,
	];

	const randomNumbersGenerated: number[] = [];
	for (let i = 0; i < questionLengths.length; i++) {
		const temp = [];
		let j = 0;
		while (j < 3) {
			const r = Math.floor(Math.random() * questionLengths[i]);
			if (temp.indexOf(r) === -1) {
				temp.push(r);
				j++;
			}
		}
		randomNumbersGenerated.push(...temp);
	}

	db.ref("users/" + uid).set({
		score: [0, 0, 0],
		school: school,
		questionsSolved: ["placeholder"],
		randomNumbers: randomNumbersGenerated,
	});

	db.ref("users/count").set(admin.database.ServerValue.increment(1));

	return randomNumbersGenerated;
});

exports.check1 = functions.https.onCall(async (data, context) => {
	const nextSchool = async function() {
		const fakePoints: any[] = [];

		await db
			.ref("schools/")
			.get()
			.then((snapshot) => {
				const data = snapshot.val();
				for (const school in data) {
					if (school) {
						fakePoints.push([school, data[school]]);
					}
				}
			});

		const actualPoints: any[] = [];

		await db
			.ref("p/")
			.get()
			.then((snapshot) => {
				const data = snapshot.val();
				for (const school in data) {
					if (school) {
						actualPoints.push([school, data[school]]);
					}
				}
			});

		const proportion: any[] = [];
		for (let i = 0; i < fakePoints.length; i++) {
			if (actualPoints[i][1] !== 0) {
				proportion.push([
					fakePoints[i][0],
					fakePoints[i][1] / actualPoints[i][1],
				]);
			}
		}

		let min = proportion[0][1];
		let minIndex = 0;
		for (let i = 1; i < proportion.length; i++) {
			if (proportion[i][1] < min) {
				min = proportion[i][1];
				minIndex = i;
			}
		}

		proportion[minIndex][1] = 100 - 2 * (proportion.length - 1);
		for (let i = 0; i < proportion.length; i++) {
			if (i !== minIndex) {
				proportion[i][1] = 2;
			}
		}

		const school = Math.floor(Math.random() * 99) + 1;
		let sum = 0;
		let index = 0;

		while (sum < school) {
			sum += proportion[index][1];
			index++;
		}
		index--;

		return proportion[index][0];
	};

	const schoolToAddTo = await nextSchool();

	let usersToAdd = Math.floor(Math.random() * 3) + 1;
	if (usersToAdd == 4) {
		usersToAdd = Math.floor(Math.random() * 6) + 4;
	}
	db.ref("users/count").set(admin.database.ServerValue.increment(usersToAdd));

	for (let i = 0; i < usersToAdd; i++) {
		const x = Math.floor(Math.random() * 9) + 1;
		let pointsToAdd = 0;
		if (x == 1) {
			pointsToAdd = 60;
		} else if (x <= 8) {
			pointsToAdd = Math.floor(Math.random() * 10) + 10;
		}

		db.ref("schools/" + schoolToAddTo).set(
			admin.database.ServerValue.increment(pointsToAdd)
		);
	}
	return true;
});

exports.check2 = functions.https.onCall(async (data, context) => {
	const nextSchool = async function() {
		const fakePoints: any[] = [];

		await db
			.ref("schools/")
			.get()
			.then((snapshot) => {
				const data = snapshot.val();
				for (const school in data) {
					if (school) {
						fakePoints.push([school, data[school]]);
					}
				}
			});

		const actualPoints: any[] = [];

		await db
			.ref("p/")
			.get()
			.then((snapshot) => {
				const data = snapshot.val();
				for (const school in data) {
					if (school) {
						actualPoints.push([school, data[school]]);
					}
				}
			});

		const proportion: any[] = [];
		for (let i = 0; i < fakePoints.length; i++) {
			if (actualPoints[i][1] !== 0) {
				proportion.push([
					fakePoints[i][0],
					fakePoints[i][1] / actualPoints[i][1],
				]);
			}
		}

		let min = proportion[0][1];
		let minIndex = 0;
		for (let i = 1; i < proportion.length; i++) {
			if (proportion[i][1] < min) {
				min = proportion[i][1];
				minIndex = i;
			}
		}

		proportion[minIndex][1] = 100 - 2 * (proportion.length - 1);
		for (let i = 0; i < proportion.length; i++) {
			if (i !== minIndex) {
				proportion[i][1] = 2;
			}
		}

		const school = Math.floor(Math.random() * 99) + 1;
		let sum = 0;
		let index = 0;

		while (sum < school) {
			sum += proportion[index][1];
			index++;
		}
		index--;

		return proportion[index][0];
	};

	const schoolToAddTo = await nextSchool();
	const usersToAdd = Math.floor(Math.random() * 10) + 20;
	db.ref("users/count").set(admin.database.ServerValue.increment(usersToAdd));

	for (let i = 0; i < usersToAdd; i++) {
		const x = Math.floor(Math.random() * 9) + 1;
		let pointsToAdd = 0;
		if (x == 1) {
			pointsToAdd = 60;
		} else if (x <= 8) {
			pointsToAdd = Math.floor(Math.random() * 10) + 10;
		}
		db.ref("schools/" + schoolToAddTo).set(
			admin.database.ServerValue.increment(pointsToAdd)
		);
	}
	return true;
});
