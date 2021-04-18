/*
 *  Cube Colouring Game
 *  Copyright (c) Luke Denton
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true,
});
const HttpStatus = require('http-status-codes');
const Filter = require('bad-words');

admin.initializeApp();

/**
 * Save a users score to the leaderboard
 */
exports.submitScore = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    const { name, time } = request.body;

    if (!name || !time) {
      response.status(HttpStatus.BAD_REQUEST).send({});
      return;
    }

    const exp = new RegExp(/^[\w\-\s]+$/);
    if (!exp.test(name)) {
      response.status(HttpStatus.BAD_REQUEST).send({ isBadChars: true });
      return;
    }

    const filter = new Filter();
    if (filter.isProfane(name)) {
      response.status(HttpStatus.BAD_REQUEST).send({ isProfane: true });
      return;
    }

    // Save the users score
    admin.database().ref('/leaderboard').push({
      name,
      time
    });

    response.status(HttpStatus.OK).send({});
  });
});
