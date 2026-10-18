var renderer, scene, camera;
var debug = false;
var tiempo = 0;
var empezado = false;
var ganado = false;
var ctx;
var textCanvas;

// Camara
var cameraControls;
var anguloCamara = 0;
var distanciaCamara = 10;
var alturaCamara = 3;
var obstaculosCamara = [];


// Monitor de recursos
const reloj = new THREE.Clock();
const stats = new Stats();

var world;

// Raycaster
const raycaster = new THREE.Raycaster();
var objectsToCheck = [];
var enSuelo=false;

// Mixamo
var actions = {};
// Array para almacenar los nombres de las animaciones
var animationNames = [];
// Índice actual de la animación
var currentAnimationIndex = 0;
var mixer = null;
var animActual;
var animSalto;

// Texturas
var textureLoader;
var metal_texture;
var wood_texture; 

// Materiales
var floorMaterial;
var pjMaterial;
var material;
var metalMaterial;
var woodMaterial;

// Objetos
var pjCaja;
var pjBody;
var pjMesh;
var eve;
var idolo;

var plataformas = [];
var trampasPinchos = [];
var trampasPendulo = [];
var antorchas = [];

const wallThickness = 1;
const wallHeight = 10;

//movimiento
var angulo = -0.01;
var spawnX = 0;
var spawnY = 2;
var spawnZ = 3;
var limiteCaida = -20;
var saltando = false;

var sombra; 

//controles

const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    speed: 5,
    jumpSpeed: 6,
    rotateLeft: false,
    rotateRight: false,
    rotateSpeed: 1.5
};

// Event listeners para controles
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = true;
            break;
        case 'Space':
            if (enSuelo && !ganado && empezado){
                pjBody.velocity.y = controls.jumpSpeed;
                saltando = true;
                if (controls.moveRight || controls.moveLeft || controls.moveBackward ||controls.moveForward){
                    animSalto = 'Jump_corriendo';
                } else {animSalto = 'Jumping';}
            }    
            break;
        case 'KeyQ':
            controls.rotateLeft = true;
            break;
        case 'KeyE':
            controls.rotateRight = true;
            break;
        case 'KeyR':
            anguloCamara = eve.rotation.y;
            break;
        case 'Enter':
            if(ganado){
                ganado = false;
                tiempo = 0;
                morir();
            }
            if (!empezado){
                empezado = true;
                tiempo = 0;
            }
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = false;
            break;
        case 'KeyQ':
            controls.rotateLeft = false;
            break;
        case 'KeyE':
            controls.rotateRight = false;
            break;
        case 'KeyC':
            debug = !debug;
            break

    }
});


function loadObjGLTF()
{
    // Instantiate a loader
    const loader = new THREE.GLTFLoader();
    // Load a glTF resourc
    let model = 'models/idolo/scene.gltf';

    loader.load(model,
        // called when the resource is loaded
        function ( gltf ) {

            idolo = gltf.scene;
            sala2.add(idolo);            

            var box = new THREE.Box3().setFromObject(idolo);
            var size = new THREE.Vector3();
            box.getSize(size);
            var s = 1 / size.y;
            idolo.scale.set(s,s,s);
            idolo.position.set(-20.80, 1.5, 117);
            idolo.rotation.y =Math.PI /2;
        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );  

}

// MIXAMO

function loadModelAndAnimations() {
    const loader = new THREE.FBXLoader();

    // Cargar modelo base
//    loader.load('models/remy/remy.fbx', function (object) {
    loader.load('models/pj/Eve.fbx', function (object) {
//    loader.load('models/Gargamel/Walking (1).fbx', function (object) {
        eve = object

        var box = new THREE.Box3().setFromObject(eve);
        var size = new THREE.Vector3();
        box.getSize(size);
        var s = 2.0 / size.y;
        eve.scale.set(s,s,s);
        eve.position.set(0, -1, 0);
        pjMesh.add(eve);

        mixer = new THREE.AnimationMixer(eve);

        // Ajustar materiales
        eve.traverse(function (child) {
            if (child.isMesh) {
                child.material.transparent = false;
                child.material.opacity = 1.0;
            }
        });

        // Cargar y aplicar animaciones
        //const animations = ['models/remy/Walking.fbx', 'models/remy/Fast Run.fbx','models/remy/Big Jump.fbx'];
        const animations = ['models/pj/Jump_corriendo.fbx', 'models/pj/Death.fbx', 'models/pj/Running.fbx', 'models/pj/Falling.fbx', 'models/pj/Jumping.fbx', 'models/pj/Idle.fbx'];
        animations.forEach(function (animFile, index) {
            loader.load(animFile, function (animData) {
                // Extraer el nombre del archivo sin la ruta ni la extensión .fbx
                const name = animFile.split('/').pop().split('.').slice(0, -1).join('.');
                const action = mixer.clipAction(animData.animations[0]);
                actions[name] = action; // Guardar la acción con el nombre del archivo
                if(name == 'Jumping' || name == 'Jump_corriendo'){
                    actions[name].setLoop(THREE.LoopOnce);
                    actions[name].clampWhenFinished = true;

                }
                animationNames[index] = name; // Almacenar nombre de animación en el array
                                              
            });
        });

    }, undefined, function (error) {
        console.error(error);
    });
}


function changeAnimation(nombre) {

    if (nombre != animActual && actions[nombre]){
        if (animActual !== undefined){
            // actions[animActual].stop();
            actions[animActual].fadeOut(0.2);

        }
        animActual = nombre;
        // actions[animActual].play();
        actions[animActual].reset();
        actions[animActual].fadeIn(0.2);
        actions[animActual].play();

    }
}

function morir(){
    pjBody.position.set(spawnX,spawnY,spawnZ); //respawn
    pjBody.velocity.set(0, 0, 0);
}

function parpadear(luz, base){

    const parpadeo = new TWEEN.Tween( luz ).to( {intensity:base + Math.random() * 0.5}, 100 );

    parpadeo.onComplete(function(){
        parpadear(luz, base)
    })

    parpadeo.start();

}

// CREACION OBJETOS

function createAntorcha(padre, x, y, z, rotationY, distance){
    const antorcha = new THREE.Object3D();
    // antorcha.position.set(x, y, z);
    padre.add(antorcha);
    
    //palo
    const paloGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.75, 32);
    const palo = new THREE.Mesh(paloGeometry, woodMaterial);
    
    antorcha.add(palo);
    
    //"llama"
    const llamaGeometry = new THREE.ConeGeometry(0.09, 0.25 , 32);
    const llamaMaterial = new THREE.MeshBasicMaterial({color: 0xEBA134}); // Material básico para visualizar las caras
    
    const llama = new THREE.Mesh(llamaGeometry, llamaMaterial);
    llama.position.y = 0.8/2;
    antorcha.add(llama);
    
    const pointLight = new THREE.PointLight(0xEBA134, 2, distance); // color, intensidad, distancia
    pointLight.position.set(0, llama.position.y + 0.13, 0); // Posicionar la luz puntual
    pointLight.decay = 2
    antorcha.add(pointLight);

        
    let M = new THREE.Matrix4();
    let T = new THREE.Matrix4();
    T.makeTranslation(x, y, z);
    let Ry = new THREE.Matrix4();
    let Rx = new THREE.Matrix4();
    
    Ry.makeRotationY(rotationY / 180 * Math.PI);
    Rx.makeRotationX(30 / 180 * Math.PI);
    
    M.multiply(T);
    M.multiply(Ry);
    M.multiply(Rx);
    
    antorcha.matrix.identity();
    antorcha.applyMatrix4(M);

    antorcha.luz = pointLight;
    antorcha.base = 2;
    antorchas.push(antorcha);
    parpadear(pointLight, 2);
}

function createSuelo(padre, x, z, ancho, fondo, grosor){

    const texture_floor = textureLoader.load('images/old_stone_floor.jpg'); 
    texture_floor.wrapS = THREE.RepeatWrapping;
    texture_floor.wrapT = THREE.RepeatWrapping;
    texture_floor.repeat.set(ancho / 4, fondo / 4);

    const sueloMaterial = new THREE.MeshPhongMaterial({specular:0x111111 , shininess:5, map:texture_floor});


    const geometriaPiso = new THREE.BoxGeometry(ancho, grosor, fondo);
    const piso = new THREE.Mesh(geometriaPiso, sueloMaterial);
    piso.position.set(x, -grosor / 2, z);
    padre.add(piso);
    objectsToCheck.push(piso);

    const groundShape = new CANNON.Box(new CANNON.Vec3(ancho / 2, grosor / 2, fondo / 2));
    const ground = new CANNON.Body({ mass: 0, material: floorMaterial });
    ground.addShape(groundShape);
    ground.position.copy(piso.position);
    world.addBody(ground);
    piso.body = ground;

}

function createPendulo(padre, x, z, angulo, espera){
    const pendulo = new THREE.Object3D();
    pendulo.position.set(x, 6.5, z);
    pendulo.rotation.z = angulo
    padre.add(pendulo);

    const brazoGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 32);
    const brazo = new THREE.Mesh(brazoGeometry, woodMaterial);
    brazo.position.y = -2.5;
    pendulo.add(brazo);

    const cuchillaGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32, 1, false, 0, Math.PI);
    const cuchilla = new THREE.Mesh(cuchillaGeometry, metalMaterial);
    cuchilla.rotation.x = Math.PI / 2
    cuchilla.rotation.y = -Math.PI / 2
    cuchilla.position.y = -5;
    pendulo.add(cuchilla);

    pendulo.largo = 5.5

    const giroCuchilla = new TWEEN.Tween( pendulo.rotation ).to( {z:-angulo}, espera );
    giroCuchilla.repeat(Infinity);
    giroCuchilla.yoyo(true);
    giroCuchilla.easing( TWEEN.Easing.Sinusoidal.InOut );
    giroCuchilla.start();

    trampasPendulo.push(pendulo);


}

function createPinchos(padre, x, z, espera){


    const pinchos = new THREE.Object3D();
    pinchos.position.set(x, -1, z);
    padre.add(pinchos);

    const baseGeometry = new THREE.BoxGeometry(2, 0.5, 2); // Dimensiones del box
    const baseMesh = new THREE.Mesh(baseGeometry, metalMaterial);
    baseMesh.position.y = -0.25;
    pinchos.add(baseMesh);
    const geometriaPincho = new THREE.ConeGeometry(0.2, 1, 32);

    for (let i = 0; i < 3; i++){
        for (let j = 0; j < 3; j++){
            const pincho = new THREE.Mesh(geometriaPincho, metalMaterial);

            pincho.position.set((i - 1) * 0.8, 0.5, (j - 1) * 0.8); 
            pinchos.add(pincho);
        }
    }

    // animacion
    const cadena = []

    for (let i = 0; i < 3; i++){
        const subirPinchos = new TWEEN.Tween( pinchos.position ).to( {y:-0.1}, 200 );
        cadena.push(subirPinchos);
        const bajarPinchos = new TWEEN.Tween( pinchos.position ).to( {y:-1}, 200 );
        cadena.push(bajarPinchos);
        };
    
    const pinchosEspera = new TWEEN.Tween( pinchos.position ).to( {y:-1}, espera );
    cadena.push(pinchosEspera);
    for (let i = 0; i < cadena.length - 1; i++){
        cadena[i].chain(cadena[i+1]);
    }
    cadena[cadena.length-1].chain(cadena[0])

	cadena[0].start();


    trampasPinchos.push(pinchos);

}

function createPlatform(padre, x, y, z, haciaX, haciaY, haciaZ, tiempo){
    // PLATAFORMAS
    const platGeometry = new THREE.BoxGeometry(4, 0.5, 4); // Dimensiones del box
    const platMesh = new THREE.Mesh(platGeometry, woodMaterial);
    platMesh.position.set(x, y, z); // Posición inicial
    platMesh.prevX = x;
    platMesh.prevZ = z;
    padre.add(platMesh);
    plataformas.push(platMesh);
    objectsToCheck.push(platMesh);
    
    // fisicas
    const platShape = new CANNON.Box(new CANNON.Vec3(2, 0.25, 2));
    const platBody = new CANNON.Body({ mass: 0, material: floorMaterial });
    platBody.addShape(platShape);
    platBody.position.copy(platMesh.position);
    world.addBody(platBody);
    platMesh.cuerpoPlat = platBody;

    // animacion
    const movPlataforma = new TWEEN.Tween( platMesh.position ).to( {x:haciaX, y:haciaY, z:haciaZ}, tiempo );
	// giro.easing( TWEEN.Easing.Elastic.Out );
	movPlataforma.repeat(Infinity);
    movPlataforma.yoyo(true);
    movPlataforma.easing( TWEEN.Easing.Sinusoidal.InOut );
	movPlataforma.start();
    
}


function createPared(padre, x, y, z, rotationY, wallLength, wallHeight) {

    const texture_wall = textureLoader.load('images/old_stone_wall.jpg'); 
    texture_wall.wrapS = THREE.RepeatWrapping;
    texture_wall.wrapT = THREE.RepeatWrapping;
    texture_wall.repeat.set(wallLength / 4, wallHeight / 4);

    const wallMaterial = new THREE.MeshPhongMaterial({specular:0x111111 , shininess:5, map:texture_wall});



    // Visual
    const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(x, y, z);
    wallMesh.rotation.y = rotationY;
    padre.add(wallMesh);
    obstaculosCamara.push(wallMesh);

    // Físico
    const wallShape = new CANNON.Box(new CANNON.Vec3(wallLength / 2, wallHeight / 2, wallThickness / 2));
    const wallBody = new CANNON.Body({ mass: 0, material: floorMaterial });
    wallBody.addShape(wallShape);
    wallBody.position.set(x, y, z);
    wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationY);
    world.addBody(wallBody);

    // Relación entre físico y visual
    wallMesh.body = wallBody;

    return wallMesh;
}

init();
loadScene();
render();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x000000));
    document.getElementById('container').appendChild(renderer.domElement);

    stats.showPanel(0);	// FPS inicialmente. Picar para cambiar panel.
	document.getElementById( 'container' ).appendChild( stats.domElement );

    // Configurar el canvas de texto
    textCanvas = document.getElementById("text_canvas");
    ctx = textCanvas.getContext("2d");
    // quiero que tenga las mismas dimensiones que el canvas del three.js
    textCanvas.width = window.innerWidth;
    textCanvas.height = window.innerHeight;  

    scene = new THREE.Scene();


    world = new CANNON.World(); 
    world.gravity.set(0,-9.8,0); 

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 2000);
    camera.position.set(0, 10, 30);

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 0, 0);

    window.addEventListener('resize', updateAspectRatio);

}

function loadScene() {
    textureLoader = new THREE.TextureLoader();
    material = new THREE.MeshBasicMaterial({color: 0x000000}); // Material básico para visualizar las caras
    floorMaterial = new CANNON.Material("floorMaterial");
    pjMaterial = new CANNON.Material("pjMaterial");
    metal_texture = textureLoader.load('images/metal.jpg'); 
    metalMaterial = new THREE.MeshPhongMaterial({specular:0x444444 , shininess:10, map:metal_texture});
    wood_texture = textureLoader.load('images/wood.jpg'); 
    woodMaterial = new THREE.MeshPhongMaterial({specular:0x111111 , shininess:5, map:wood_texture});

    


    templo = new THREE.Object3D();
    scene.add(templo);

    sala1 = new THREE.Object3D();
    templo.add(sala1);

    sala2 = new THREE.Object3D();
    templo.add(sala2);



    // SUELO
    createSuelo(sala1, 0, 25, 8, 50, 0.5);


    // PAREDES
    createPared(sala1, 0, wallHeight / 2, 0 / 2 - wallThickness / 2, 0, 8, wallHeight); // Pared atras
    createPared(sala1, 4, wallHeight / 2, 50 / 2 - wallThickness / 2, 90 / 180 * Math.PI, 50, wallHeight); // Pared izquierda
    createPared(sala1, -4, wallHeight / 2, 50 / 2 - wallThickness / 2, 90 / 180 * Math.PI, 50, wallHeight); // Pared derecha

    // TRAMPAS SALA 1
    createPinchos(sala1, 2, 10, 1000);
    createPinchos(sala1, -2, 10, 1000);
    createPinchos(sala1, 0, 10, 1000);

    
    
    createPendulo(sala1, 0, 15, -1, 2000);
    
    createPinchos(sala1, 2, 23, 1000);
    createPinchos(sala1, -2, 23, 1000);
    createPinchos(sala1, 0, 23, 1000);
    
    createPinchos(sala1, 2, 28, 1000);
    createPinchos(sala1, -2, 28, 1000);
    createPinchos(sala1, 0, 28, 1000);
    
    createPendulo(sala1, 0, 35, 1, 2000);
    createPendulo(sala1, 0, 36, -1, 2000);
    
    createPendulo(sala1, 3, 40, 1.7, 1000);
    createPendulo(sala1, -3, 41, -1.7, 1000);
    
    // Antorchas

    createAntorcha(sala1, 0, 2.5, 0, 0, 10);
    createAntorcha(sala1, -3.5, 2.5, 10, 90, 8);
    createAntorcha(sala1, 3.5, 2.5, 20, -90, 8);
    createAntorcha(sala1, -3.5, 2.5, 30, 90, 8);
    createAntorcha(sala1, 3.5, 2.5, 40, -90, 8);


    // SALA 2
    createSuelo(sala2, 0, 52, 8, 4, 20);    
    
    //plataformas fijas
    createSuelo(sala2, -18, 58, 4, 4, 20);
    createPinchos(sala2, -18, 58, 2000);
    createSuelo(sala2, -12, 100, 4, 4, 20);
    createPinchos(sala2, -12, 100, 2000);
    
    //plataformas
    createPlatform(sala2, 0, -0.25, 58, 0, -0.25, 70, 4000);
    createPlatform(sala2, 6, -0.25, 94, 6, -0.25, 70, 12000 );
    createPlatform(sala2, 6, -0.25, 100, -6, -0.25, 100, 4000 );
    createPlatform(sala2, -12, -0.25, 76, 0, -0.25, 76, 4000 );
    createPlatform(sala2, -18, -0.25, 100, -18, -0.25, 64, 12000 );
    
    // Rellano salida y pasillo idolo
    createSuelo(sala2, -21, 106, 8, 4, 20);
    createSuelo(sala2, -21, 114, 8, 12, 20);

    // Plataforma idolo
    const atrilGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const atril = new THREE.Mesh(atrilGeometry, woodMaterial);
    atril.position.set(-21, 0.75, 117);

    sala2.add(atril);

    //cuchillas

    createPendulo(sala2, 6, 82, -1, 1500);
    createPendulo(sala2, -18, 94, 1, 1500);

    //paredes

    createPared(sala2, 9, (wallHeight - 20) / 2, 79.5 , 90 / 180 * Math.PI, 59, wallHeight + 20);
    createPared(sala2, -27, (wallHeight - 20) / 2, 79.5 , 90 / 180 * Math.PI, 59, wallHeight + 20);
    createPared(sala2, 6.5, (wallHeight - 20) / 2, 50 , 0 / 180 * Math.PI, 5, wallHeight + 20);
    createPared(sala2, -15.5, (wallHeight - 20) / 2, 50 , 0 / 180 * Math.PI, 23, wallHeight + 20);
    createPared(sala2, -4, (wallHeight - 20) / 2, 109 , 0 / 180 * Math.PI, 26, wallHeight + 20);
    createPared(sala2, -26, (wallHeight - 20) / 2, 109 , 0 / 180 * Math.PI, 2, wallHeight + 20);

    createPared(sala2, -17, wallHeight / 2, 114.5 , 90 / 180 * Math.PI, 11, wallHeight);
    createPared(sala2, -25, wallHeight / 2, 114.5 , 90 / 180 * Math.PI, 11, wallHeight);
    createPared(sala2, -21, wallHeight / 2, 120 , 0 / 180 * Math.PI, 8, wallHeight);

    // antorchas
    createAntorcha(sala2, 5.5, 4, 50.7, 0, 18);
    createAntorcha(sala2, -5.5, 4, 50.7, 0, 18);
    createAntorcha(sala2, 8.3, 4, 82, -90, 22);
    createAntorcha(sala2, -26.3, 4, 94, 90, 22);
    createAntorcha(sala2, -26.3, 4, 76, 90, 22); 
    createAntorcha(sala2, -26.3, 4, 58, 90, 22);
    createAntorcha(sala2, -12, 4, 108.3, 180, 22);
    createAntorcha(sala2, -15.5, 4, 108.3, 180, 18);
    createAntorcha(sala2, -17.7, 3.5, 114, -90, 18);
    createAntorcha(sala2, -24.3, 3.5, 114, 90, 18);

    

    // PERSONAJE
    pjMesh = new THREE.Object3D();
    scene.add(pjMesh);

    const geometry = new THREE.CircleGeometry( 0.35, 32 );
    const materialSombra = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.5 } );
    sombra = new THREE.Mesh( geometry, materialSombra );
    sombra.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2) ;
    scene.add( sombra )



    const pjGeometry = new THREE.BoxGeometry(1, 2, 1); // Dimensiones del box
    pjCaja = new THREE.Mesh(pjGeometry, material);
    pjMesh.position.set(spawnX,spawnY,spawnZ); // Posición inicial
    pjMesh.add(pjCaja);

    // Crear el body para Cannon.js
    const boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)); // La mitad de las dimensiones del box
    pjBody = new CANNON.Body({ mass: 5, material: pjMaterial }); // Una masa no nula para que pueda moverse
    const contactMat = new CANNON.ContactMaterial(floorMaterial, pjMaterial, {
    friction: 0.0,
    restitution: 0.0
    });
    world.addContactMaterial(contactMat);   
    pjBody.addShape(boxShape);
    pjBody.fixedRotation = true;
    pjBody.updateMassProperties();
    pjBody.position.copy(pjMesh.position);
    world.addBody(pjBody);

    // Relacionar el body con el mesh
    pjMesh.body = pjBody;

    // LUCES

    // Añadir luz ambiental
    const ambientLight = new THREE.AmbientLight(0x111111); // luz tenue
    scene.add(ambientLight);

    // EJES
    if(debug){
        var axesHelper = new THREE.AxesHelper(10); // El parámetro es el tamaño de los ejes
        scene.add(axesHelper);
    }


    loadModelAndAnimations();
    loadObjGLTF();

}

function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    textCanvas.width = window.innerWidth;
    textCanvas.height = window.innerHeight;  
}

function update() {
    // cameraControls.update();
    TWEEN.update();
    const delta = Math.min(reloj.getDelta(), 0.05);
    let vx = 0; //velocidad en x del personaje
    let vz = 0; //velocidad en z del personaje
    let adelante = 0;
    let derecha = 0;

    if (!ganado && empezado){
        tiempo += delta;
    }

    // texto superpuesto
    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("Tiempo: " + tiempo.toFixed(2) + " s", textCanvas.width / 2, 50);




    ctx.textAlign = "right";
    ctx.font = "24px Arial";
    ctx.fillText("Controles: ", textCanvas.width - 30, 40);
    ctx.fillText("WASD: Movimiento ", textCanvas.width - 30, 65);
    ctx.fillText("Espacio: Saltar ", textCanvas.width - 30, 90);
    ctx.fillText("Q / E: Mover cámara ", textCanvas.width - 30, 115);
    ctx.fillText("R: Reiniciar cámara ", textCanvas.width - 30, 140);



    if (mixer!=null) mixer.update(delta);

    // Raycaster
    raycaster.set(pjMesh.position, new THREE.Vector3(0, -1, 0) );
    const intersects = raycaster.intersectObjects(objectsToCheck, true);
    if (intersects.length > 0 && intersects[0].distance < 1.1) {
            enSuelo = true;
        } else {enSuelo = false;}

    if (intersects.length > 0){
        sombra.visible = true;
        sombra.position.x = pjMesh.position.x;
        sombra.position.z = pjMesh.position.z;
        sombra.position.y = intersects[0].point.y + 0.02;
        let s = 1 - (intersects[0].distance - 1) * 0.15
        sombra.scale.set(s,s,s);
    } else {
        sombra.visible = false;
    }

 

    if (enSuelo && intersects[0].object.prevX !== undefined){
        let dx = intersects[0].object.position.x - intersects[0].object.prevX;
        let dz = intersects[0].object.position.z - intersects[0].object.prevZ;
        pjBody.position.x += dx;
        pjBody.position.z += dz;
    }

    for( let i = 0; i < plataformas.length; i++){

        plataformas[i].prevX = plataformas[i].position.x;
        plataformas[i].prevZ = plataformas[i].position.z;
        plataformas[i].cuerpoPlat.position.copy(plataformas[i].position);

    }

    
    // Control
    if (controls.moveForward) {
        //  vz += controls.speed
        adelante += 1;
        }

    if (controls.moveBackward) {
        //  vz -= controls.speed
        adelante -= 1;
        }

    if (controls.moveLeft) {
        //  vx += controls.speed
        derecha -=1;
        }

    if (controls.moveRight) {
        // vx -= controls.speed
        derecha += 1;
    }
    vx = (adelante * Math.sin(anguloCamara) - derecha * Math.cos(anguloCamara)) * controls.speed;
    vz = (adelante * Math.cos(anguloCamara) + derecha * Math.sin(anguloCamara)) * controls.speed;

    if (ganado){
        ctx.textAlign = "center";
        ctx.font = "48px Arial";
        ctx.fillText("¡HAS CONSEGUIDO EL ÍDOLO!", textCanvas.width / 2, textCanvas.height / 2);
        ctx.font = "32px Arial";
        ctx.fillText("Tiempo total: " + tiempo.toFixed(2) + " s", textCanvas.width / 2, textCanvas.height / 2 + 50);
        ctx.fillText("Pulsa ENTER para volver a empezar", textCanvas.width / 2, textCanvas.height / 2 + 100);
        vx = 0;
        vz = 0;
    }

    if (!empezado){
        ctx.textAlign = "center";
        ctx.font = "48px Arial";
        ctx.fillText("¡ESTE TEMPLO ES UN PELIGRO!", textCanvas.width / 2, textCanvas.height / 2);
        ctx.font = "32px Arial";
        ctx.fillText("Pero esconde un gran tesoro. Consíguelo lo más rapido que puedas.", textCanvas.width / 2, textCanvas.height / 2 + 50);
        ctx.fillText("Pulsa ENTER para comenzar", textCanvas.width / 2, textCanvas.height / 2 + 100);
        vx = 0;
        vz = 0;
    }

    pjBody.velocity.x = vx;
    pjBody.velocity.z = vz;

    if (eve !== undefined && (vx !== 0 || vz !== 0)){
        eve.rotation.y = Math.atan2(vx, vz);
    }

    if (enSuelo && pjBody.velocity.y <= 0){
        saltando = false;
    }

    if (saltando){
        changeAnimation(animSalto);
    } else if (!enSuelo){
        changeAnimation('Falling');
    } else if (vx !== 0 || vz !== 0){
        changeAnimation('Running');
    } else {changeAnimation('Idle');

    }


    if (pjBody.position.y < limiteCaida){
        morir();
    }

    
    // Fisica
    world.step(delta);
    // Mensajero
    scene.traverse(function(obj) {
        if (obj.body !== undefined) {
            obj.position.copy(obj.body.position);
            obj.quaternion.copy(obj.body.quaternion);
        }
    });
    
    // Daño Trampa Pinchos
    for (let i = 0; i < trampasPinchos.length; i++){
        if(trampasPinchos[i].position.y > -0.3 && Math.abs(pjBody.position.x - trampasPinchos[i].position.x) < 1.5 && Math.abs(pjBody.position.z - trampasPinchos[i].position.z) < 1.5){ //están fuera y estoy encima
            morir()
        }

    }

    // Daño cuchilla
    for (let i = 0; i < trampasPendulo.length; i++){
        let anguloCuchilla = trampasPendulo[i].rotation.z;
        let puntaX = trampasPendulo[i].position.x + trampasPendulo[i].largo * Math.sin(anguloCuchilla);
        let puntaY = trampasPendulo[i].position.y - trampasPendulo[i].largo * Math.cos(anguloCuchilla);
        let puntaZ = trampasPendulo[i].position.z

        
        if(Math.abs(pjBody.position.x - puntaX) < 1.5 && Math.abs(pjBody.position.y - puntaY) < 1.25 && Math.abs(pjBody.position.z - puntaZ) < 0.6){ //están fuera y estoy encima
            morir()
        }

    }

    // Deteccion victoria
    if (Math.abs(pjBody.position.x - (-21)) < 1.5 && Math.abs(pjBody.position.z - 117) < 1.5){
        ganado = true;
    }

    // Camara
    let d = distanciaCamara;
    
    
    
    if(controls.rotateLeft){
        anguloCamara += controls.rotateSpeed * delta ;
    }
    if(controls.rotateRight){
        anguloCamara -= controls.rotateSpeed * delta;
    }
    


    cameraControls.enabled = debug;
    if (!debug){        
        
        raycaster.set(pjMesh.position, new THREE.Vector3(-Math.sin(anguloCamara), 0, - Math.cos(anguloCamara)) );
        const intersectsCam = raycaster.intersectObjects(obstaculosCamara, true);
        if (intersectsCam.length > 0 && intersectsCam[0].distance < d){
            d = intersectsCam[0].distance - 1;
        }
        camera.position.set(pjMesh.position.x - Math.sin(anguloCamara) * d, pjMesh.position.y + alturaCamara , pjMesh.position.z - Math.cos(anguloCamara) * d);
        camera.lookAt(pjMesh.position.x,  pjMesh.position.y + 1 ,pjMesh.position.z);
    } else{
            cameraControls.update();
        }
    
    // pjCaja.visible = debug;
    pjCaja.visible = false;
    stats.update();

}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}