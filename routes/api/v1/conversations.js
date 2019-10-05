'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uuid = require('uuid/v4');
require('dotenv').load();
const log = require('simple-node-logger').createSimpleFileLogger('debug.log');

function validRequest(query) {
	return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

const apiUrl = '/api/v1';
let db;
let conversationsMessagesCollection;
let conversationsRoomsCollection;
let conversationsParticipantsCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {
	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	conversationsMessagesCollection = db.collection('conversationsMessages');
	conversationsRoomsCollection = db.collection('conversationsRooms');
	conversationsParticipantsCollection = db.collection('conversationsParticipants');

});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	// Parameters for `get`
	let filters = {};
	let sort = {};

	//Fetch conversationsRooms
	expressApp.get(apiUrl + '/conversations', (req, res) => {

		if (validRequest(req.query)) {
			let conversationRoomId = req.query.conversationRoomId ? req.query.conversationRoomId : null;
			// if (conversationRoomId === null) {
			//   return res.status(200).json([]);
			// }
			conversationsRoomsCollection.find({}).toArray(function(error, items) {
				if (error) {
					console.log(apiUrl + '/conversations: ', error);
					return res.status(500).json({error: 'db_error'});
				}
				return res.status(200).json(items);
			});

		}
		else {
			return res.status(403).json({error: 'forbidden'});
		}
	});

	//Fetch conversationParticipant by user_id
	expressApp.get(apiUrl + '/conversations', (req, res) => {

		if (validRequest(req.query)) {
			let participantId = req.query.participantId ? req.query.participantId : null;
			if (participantId === null) {
				return res.status(200).json([]);
			}
			conversationsParticipantsCollection.find({participantId: participantId}).toArray(function(error, items) {
				if (error) {
					console.log(apiUrl + '/conversations: ', error);
					return res.status(500).json({error: 'db_error'});
				}
				return res.status(200).json(items);
			});
		}
		else {
			return res.status(403).json({error: 'forbidden'});
		}
	});

	/**
	 * Private API endpoint: Conversations
	 */

	expressApp.post(apiUrl + '/conversations', (req, res) => {

		let now = new Date();
		let postData = req.body;

		switch (postData.action) {

			case 'add_message':

				let newItem = {
					conversationRoomId: postData.conversationRoomId,
					conversationParticipantId: postData.conversationParticipantId,
					conversationRoomTitle: postData.conversationRoomTitle,
					messageContent: postData.messageContent,
					createdBy: postData.createdBy,
					createdAt: now,
					moddifiedAt: now
				};

				//CONVERATION - ROOM

				//CHECK IF ANY ROOM EXIST
				conversationsRoomsCollection.countDocuments(function(err, count) {
					console.dir('Rooms error: ' + err);
					console.dir('Rooms count: ' + count);

					//IF NO ROOM EXISTS
					if (count == 0) {
						let newRoom = {
							conversationRoomTitle: postData.conversationRoomTitle,
							createdAt: now,
						};
						conversationsRoomsCollection.insertOne(newRoom, (error, results) => {
							if (error) {
								console.log('api :: error :: /conversations :: add :: ', error);
								return res.json({
									status: 'database_error'
								});
							}

							return res.json({
								status: 'room_added',
								return: 'newRoom',
								data: newRoom,

							});

						});
					}

					//ELSE - ROOM EXISTS - GET ROOM ID
					else {
						conversationsRoomsCollection.findOne({
							_id: ObjectID(postData.conversationRoomId)
						}, function(error, item) {

							if (error) {
								console.log('api :: error :: /conversations :: get :: ', error);
								return res.json({
									status: 'database_error'
								});
							}
							else {
								if (item) {
									return res.json({
										status: 'room_fetched',
										return: 'room',
										conversationRoomId: item._id //need to assign it to newItem-conversationRoomId
									});
								}
							}

						});
					}
				});

				//CONVERATION - PARTICIPANT

				//CHECK IF ANY PARTICIPANT EXIST
				conversationsParticipantsCollection.countDocuments(function(err, count) {
					console.dir('Participants error: ' + err);
					console.dir('Participants count: ' + count);

					//IF NO PARTICIPANTS EXISTS
					if (count == 0) {
						let newParticipant = {
							conversationParticipantId: postData.conversationParticipantId,
							conversationRoomId: postData.conversationRoomId,
							createdAt: now,
						};
						conversationsParticipantsCollection.insertOne(newParticipant, (error, results) => {
							if (error) {
								console.log('api :: error :: /conversations :: add :: ', error);
								return res.json({
									status: 'database_error'
								});
							}

							return res.json({
								status: 'participant_added',
								return: 'newParticipant',
								data: newParticipant
							});

						});

					}

					//ELSE - PARTICIPANT EXISTS - GET PARTICIPANT ID
					else {
						conversationsParticipantsCollection.findOne({
							_id: ObjectID(postData.conversationParticipantId)
						}, function(error, item) {

							if (error) {
								console.log('api :: error :: /conversations :: get :: ', error);
								return res.json({
									status: 'database_error'
								});
							}
							else {
								if (item) {
									return res.json({
										status: 'participant_fetched',
										return: 'participant',
										conversationParticipantId: item._id  //need to assign to newItem-conversationParticipantId
									});
								}
							}

						});
					}
				});

				//SAVE MESSAGE

				conversationsMessagesCollection.insertOne(newItem, (error, results) => {

					if (error) {
						console.log('api :: error :: /conversations :: add :: ', error);
						return res.json({
							status: 'database_error'
						});
					}

					return res.json({

						status: 'message_sent',
						return: 'newMessage',
						data: newItem

					});

				});

				break;




			// case 'get_message':

			//   categoriesCollection.findOne({
			//     _id: ObjectID(postData._id)
			//   }, function (error, item) {

			//     if (error) {
			//       console.log('api :: error :: /conversations :: get :: ', error);

			//       return res.json({
			//         status: 'database_error'
			//       });
			//     }
			//     else {
			//       if (item) {
			//         return res.json({
			//           status: 'item_fetched',
			//           return: 'conversations',
			//           data: item
			//         });
			//       }
			//       else {
			//         return res.json({
			//           status: 'no_item',
			//           return: 'conversations',
			//           data: {}
			//         });
			//       }
			//     }
			//   });

			//   break;

			// case 'remove':

			//   conversationsCollection.deleteOne({
			//     _id: ObjectID(postData._id)
			//   }, (error, result) => {

			//     if (error) {
			//       console.log('api :: error :: /conversations :: remove :: ', error);

			//       return res.json({
			//         status: 'database_error'
			//       });
			//     }

			//     return res.json({
			//       status: 'item_deleted',
			//       return: 'result',
			//       data: result
			//     });

			//   });

			//   break;

		}

	});

};