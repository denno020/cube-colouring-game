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

import * as THREE from 'three';
import { OrbitControls } from "./controls/OrbitControls.js";
const Filter = require('bad-words');
import party from 'party-js';
import firebase from "firebase/app";
import 'firebase/database';

var firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const API_BASE_URL = window.location === 'localhost' ?
  'http://localhost:5001/cube-colouring-app/us-central1' :
  '';

let camera, scene, renderer, mesh;
const leaderboardCount = 20;
let completionTime = 0;
const preferredColor = window.localStorage.getItem('preferred-colour');
const defaultColor = '#BADA55';
let colour = preferredColor || defaultColor;

const amount = parseInt(window.location.search.substr(1)) || 10;
const spheres = 1000;

const raycaster = new THREE.Raycaster();
const stopwatch = new THREE.Clock(false);
const mouse = new THREE.Vector2(1, 1);
const color = new THREE.Color();
const colouredSpheres = [];

init();
animate();

firebase.database().ref('/leaderboard').orderByChild('time').limitToFirst(leaderboardCount).on('value', (snapshot) => {
  const leaderboard = snapshot.val();
  const sortedLeaderboard = leaderboard ? Object.values(leaderboard).sort((a, b) => a.time - b.time) : [];
  renderLeaderboard(sortedLeaderboard);
});

function renderLeaderboard(leaderboard) {
  const leaderboardOl = document.querySelector('[data-js="leaderboard"]');
  leaderboardOl.innerHTML = '';

  for (let i = 0; i < leaderboardCount; i++) {
    const { name = '', time = '' } = leaderboard[i] || {};
    const template = document.getElementById('leaderboard-template');
    const instance = document.importNode(template.content, true);
    const entry = [time && sec2time(time), name].join(' - ');
    instance.querySelector('li').textContent = entry;
    leaderboardOl.appendChild(instance);
  }
}

window.addEventListener('click', (event) => {
  if (event.target.matches('[data-js="reset-app"]')) {
    // I don't know how to properly clear the scene 🤷‍
    window.location.reload();
  }

  if (event.target.matches('[data-js="start-app"]')) {
    document.querySelector('[data-js="welcome"]').remove();
    addEventListeners();
  }

  if (event.target.matches('[data-js="view-leaderboard"]')) {
    document.querySelector('[data-js="leaderboard-dialog"]').removeAttribute('hidden');
  }

  if (event.target.matches('[data-js="closer-leaderboard"]')) {
    document.querySelector('[data-js="leaderboard-dialog"]').setAttribute('hidden', true);
  }

  if (event.target.matches('[data-js="colour-settings-button"]')) {
    document.querySelector('[data-js="colour-settings-dialog"]').removeAttribute('hidden');
  }

  if (event.target.matches('[data-js="closer-colour-settings"]')) {
    document.querySelector('[data-js="colour-settings-dialog"]').setAttribute('hidden', true);
  }

  if (event.target.matches('[data-js="reset-preferred-colour"]')) {
    window.localStorage.removeItem('preferred-colour');
    colour = defaultColor;
    document.querySelector('[data-js="colour-settings-dialog"]').setAttribute('hidden', true);
  }
});

window.addEventListener('change', (event) => {
  if (event.target.matches('#colour-selector')) {
    colour = event.target.value;
    window.localStorage.setItem('preferred-colour', colour);
  }
})

/**
 * Event listeners for the ThreeJS application
 */
function addEventListeners() {
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);
}

function init() {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(amount, amount, amount);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();

  const light1 = new THREE.HemisphereLight(0xffffff, 0x000088);
  light1.position.set(-1, 1.5, 1);
  scene.add(light1);

  const light2 = new THREE.HemisphereLight(0xffffff, 0x880000, 0.5);
  light2.position.set(-1, -1.5, -1);
  scene.add(light2);

  const geometry = new THREE.IcosahedronGeometry(0.5, 3);
  const material = new THREE.MeshPhongMaterial();

  mesh = new THREE.InstancedMesh(geometry, material, spheres);

  let i = 0;
  const offset = (amount - 1) / 2;
  const matrix = new THREE.Matrix4();

  for (let x = 0; x < amount; x++) {

    for (let y = 0; y < amount; y++) {

      for (let z = 0; z < amount; z++) {

        matrix.setPosition(offset - x, offset - y, offset - z);

        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, color);

        i++;

      }

    }

  }

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  new OrbitControls(camera, renderer.domElement);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  raycaster.setFromCamera(mouse, camera);
  const intersection = raycaster.intersectObject(mesh);

  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId;
    mesh.setColorAt(instanceId, color.set(colour));
    mesh.instanceColor.needsUpdate = true;

    if (!colouredSpheres.includes(instanceId)) {
      if (colouredSpheres.length === 0) {
        stopwatch.start();
      }

      colouredSpheres.push(instanceId);
      updateCount();

      // Has the user coloured in all the spheres?
      if (colouredSpheres.length > 999) {
        stopwatch.stop();
        completionTime = stopwatch.getElapsedTime();
        document.querySelector('[data-js="stopwatch"]').innerText = sec2time(completionTime);
        displayCompletedDialog();
      }
    }
  }

  if (stopwatch.running) {
    document.querySelector('[data-js="stopwatch"]').innerText = sec2time(stopwatch.getElapsedTime());
  }

  renderer.render(scene, camera);
}

function updateCount() {
  document.querySelector('[data-js="coloured-count"]').innerText = colouredSpheres.length;
}

function sec2time(timeInSeconds) {
  var pad = function (num, size) {
      return ('000' + num).slice(size * -1);
    },
    time = parseFloat(timeInSeconds).toFixed(3),
    minutes = Math.floor(time / 60),
    seconds = Math.floor(time - minutes * 60),
    milliseconds = time.slice(-3);

  return pad(minutes, 2) + ':' + pad(seconds, 2) + ':' + pad(milliseconds, 3);
}

function displayCompletedDialog() {
  const completedDialog = document.querySelector('[data-js="completed"]');

  // Prevent the form submission listener being added multiple times
  if (completedDialog.getAttribute('hidden') !== '') {
    return;
  }
  const finalTimeEl = document.querySelector('[data-js="final-time"]');
  finalTimeEl.innerText = sec2time(completionTime)

  completedDialog.removeAttribute('hidden');

  party.element(document.querySelector('[data-js="coloured-count"]'));
  setTimeout(() => {
    party.element(finalTimeEl);
  }, 500)

  const saveScoreForm = document.getElementById('save-score-form');

  saveScoreForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('player-name').value;

    const exp = new RegExp(/^[\w\-\s]+$/);
    if (!exp.test(name)) {
      alert(`Please only use alphanumeric characters for your name`);
      return;
    }

    const filter = new Filter();
    if (filter.isProfane(name)) {
      alert(`Let's keep the names family friendly`);
      return;
    }

    fetch(`${API_BASE_URL}/submitScore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        time: completionTime
      })
    }).then(res => res.json()).then((response) => {
      if (response.isBadChars) {
        alert(`Please only use alphanumeric characters for your name`);
        return;
      }
      if (response.isProfane) {
        alert(`Let's keep the names family friendly`);
        return;
      }

      saveScoreForm.remove(); // Don't need the form anymore
      document.querySelector('[data-js="thank-you-message"]').removeAttribute('hidden')
    })
  })
}
