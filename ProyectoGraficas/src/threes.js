
window.addEventListener('load', init, false);

var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var hero;
var sun;
var ground;
var orbitControl;

function init() {

	createScene();

	update();
}

function createScene(){
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 60, sceneWidth / sceneHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer({alpha:true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('TutContainer');
	dom.appendChild(renderer.domElement);
	

	var heroGeometry = new THREE.BoxGeometry( 1, 1, 1 );
	var heroMaterial = new THREE.MeshStandardMaterial( { color: 0x883333 } );
	hero = new THREE.Mesh( heroGeometry, heroMaterial );
	hero.castShadow=true;
	hero.receiveShadow=false;
	hero.position.y=2;
	scene.add( hero );
	var planeGeometry = new THREE.PlaneGeometry( 5, 5, 4, 4 );
	var planeMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } )
	ground = new THREE.Mesh( planeGeometry, planeMaterial );
	ground.receiveShadow = true;
	ground.castShadow=false;
	ground.rotation.x=-Math.PI/2;
	scene.add( ground );

	camera.position.z = 5;
	camera.position.y = 1;
	
	sun = new THREE.DirectionalLight( 0xffffff, 0.8);
	sun.position.set( 0,4,1 );
	sun.castShadow = true;
	scene.add(sun);
	sun.shadow.mapSize.width = 256;
	sun.shadow.mapSize.height = 256;
	sun.shadow.camera.near = 0.5;
	sun.shadow.camera.far = 50 ;
	
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );
	orbitControl.addEventListener( 'change', render );
	orbitControl.enableZoom = false;

	
	window.addEventListener('resize', onWindowResize, false);
}

function update(){

    hero.rotation.x += 0.01;
    hero.rotation.y += 0.01;
    render();
	requestAnimationFrame(update);
}
function render(){
    renderer.render(scene, camera);
}
function onWindowResize() {
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}