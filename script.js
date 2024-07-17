let scene, camera, renderer, controls, currentModel, currentLegModel;
const models = {};
const legModels = {};

scene = new THREE.Scene();
function initCamera() {
    if (window.innerWidth < 900) {
        camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.5, 1000);
        camera.position.set(0, 0.8, 4.5);
        console.log("PHone Device");
    } else {
        camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0,0.1, 2);
        console.log("large Device");
    }
}
initCamera();
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xcccccc);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(document.getElementById('viewer').clientWidth, document.getElementById('viewer').clientHeight);
document.getElementById('viewer').appendChild(renderer.domElement);
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffff, 2.0);
scene.add(ambientLight);
scene.background = new THREE.Color('#ffffff');

const directionalLight = new THREE.DirectionalLight('#FFFFFF', 0.8 * Math.PI);
directionalLight.position.set(10, 15, 45);
scene.add(directionalLight);

const loader = new THREE.GLTFLoader();

function preloadModels(modelList) {
    const promises = modelList.map(model => {
        return new Promise((resolve, reject) => {
            loader.load(model.model_path, (gltf) => {
                models[model.model_path] = gltf.scene;
                resolve(model);
            }, undefined, (error) => {
                console.error('Error loading model:', error);
                reject();
            });
        });
    });
    return Promise.all(promises);
}

function preloadLegModels(model) {
    const promises = model.legs_path.map(leg => {
        return new Promise((resolve, reject) => {
            loader.load(leg.model_path, (gltf) => {
                legModels[leg.model_path] = gltf.scene;
                resolve();
            }, undefined, (error) => {
                console.error('Error loading leg model:', error);
                reject();
            });
        });
    });
    return Promise.all(promises);
}

function loadModel(modelPath) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    currentModel = models[modelPath];
    
    if (currentModel) {
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.x -= center.x; 
        currentModel.position.y -= center.y; 
        currentModel.position.z -= center.z; 
        scene.add(currentModel);
    }
}


function loadLegs(model) {
    const legsContainer = document.getElementById('legs-options');
    legsContainer.innerHTML = '';
    
    if (model.islegs && model.legs_path && model.legs_path.length > 0) {
        document.querySelector('.legs-color h2').style.display = 'block'; 

        model.legs_path.forEach(leg => {
            const legOption = document.createElement('div');
            legOption.classList.add('leg-option');
            legOption.setAttribute('data-leg-model', leg.model_path);
            legOption.innerHTML = `<img src="${leg.model_img}" alt="${leg.model_name}">`;
            legsContainer.appendChild(legOption);

            legOption.addEventListener('click', function () {
                const legPath = this.getAttribute('data-leg-model');
                loadLegModel(legPath);
            });
        });
        
        preloadLegModels(model);
    } else {
        document.querySelector('.legs-color h2').style.display = 'none'; 
        console.warn('No legs_path found for model:', model.model_name);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.legs-color h2').style.display = 'none';

    fetch('models/models.json')
        .then(response => response.json())
        .then(data => {
            return preloadModels(data);
        })
        .then(data => {
            const modelOptionsContainer = document.getElementById('model-options');
            data.forEach(model => {
                const modelOption = document.createElement('div');
                modelOption.classList.add('model-option');
                modelOption.setAttribute('data-model', model.model_path);
                modelOption.setAttribute('data-islegs', model.islegs);
                modelOption.innerHTML = `<img src="${model.model_img}" alt="${model.model_name}">`;
                modelOptionsContainer.appendChild(modelOption);

                modelOption.addEventListener('click', function () {
                    const modelPath = this.getAttribute('data-model');
                    const isLegs = this.getAttribute('data-islegs') === 'true';
                    
                    if (currentLegModel) {
                        scene.remove(currentLegModel);
                        currentLegModel = null; 
                    }

                    loadModel(modelPath);
                    if (isLegs) {
                        loadLegs(model);
                    } else {
                        document.getElementById('legs-options').innerHTML = '';
                        document.querySelector('.legs-color h2').style.display = 'none'; 
                    }
                });
            });
        })
        .catch(error => console.error('Error loading models:', error));
});

function loadLegModel(legModelPath) {
    if (currentLegModel) {
        scene.remove(currentLegModel);
    }
    
    currentLegModel = legModels[legModelPath];
    
    if (currentLegModel) {
        const box = new THREE.Box3().setFromObject(currentLegModel);
        const center = box.getCenter(new THREE.Vector3());
        currentLegModel.position.x -= center.x; 
        currentLegModel.position.y -= center.y; 
        currentLegModel.position.z -= center.z; 
        scene.add(currentLegModel);
    } else {
        console.warn('Leg model not found:', legModelPath);
    }
}

    
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const viewer = document.getElementById('viewer');
    camera.aspect = viewer.clientWidth / viewer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    
});

window.onload = function() {    
    fetch('https://taskmanagementapi-v1-ashen.vercel.app/user/activity', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
};

animate();
