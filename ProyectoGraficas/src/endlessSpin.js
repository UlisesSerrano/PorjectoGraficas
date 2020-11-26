/*
Ulises Serrano Martinez
A01233000

Martin Rodrigo Ruiz Mares
A00821630

*/
window.addEventListener('load', init, false);

var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var sun;
var ground;
var orbitControl;
var rollingGroundSphere;
var heroSphere;
var rollingSpeed=0.003;
var heroRollingSpeed;
var worldRadius=26;
var heroRadius=0.2;
var sphericalHelper;
var pathAngleValues;
var heroBaseY=1.8;
var bounceValue=0.1;
var gravity=0.005;
var leftLane=-1;
var rightLane=1;
var middleLane=0;
var currentLane;
var clock;
var jumping;
var treeReleaseInterval=0.5;
var lastTreeReleaseTime=0;
var treesInPath;
var treesPool;
var particleGeometry;
var particleCount=20;
var explosionPower =1.06;
var particles;
var hasCollided;

var movementSpeed =0.2;
var totalObjects = 1000;
var objectSize = 0.05;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
var dirs = [];
var parts = [];
var sizeRandomness = 4000;
var text = '0'
let group, textMesh1, textMesh2, textGeo, materials;
font = undefined
var counterTime = 0

let particleSystem, particleCountSnow, particlesSnow;

const lightColors = [
	'#2980b9',
	'#16a085',
	'#d35400',
	'#8e44ad',
	'#c0392b',
	'#2c3e50',
	'#b33939',
	'#218c74'
  ]

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init() {
	//se crea el escenario
	createScene();

	//El juego se pone en loop
	update();
}

function createScene(){
	hasCollided=false;
	treesInPath=[];
	treesPool=[];
	clock=new THREE.Clock();
	clock.start();
	clock2=new THREE.Clock();
	clock2.start();
	heroRollingSpeed=(rollingSpeed*worldRadius/heroRadius)/5;
	sphericalHelper = new THREE.Spherical();
	pathAngleValues=[1.52,1.57,1.62];
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();//the 3d scene
    scene.fog = new THREE.FogExp2( 0xf0fff0, 0.14 );
    camera = new THREE.PerspectiveCamera( 60, sceneWidth / sceneHeight, 0.1, 1000 );//perspectiva de la camara
    renderer = new THREE.WebGLRenderer({alpha:true});//renderer  con un backdrop transparente 
    renderer.setClearColor(0xfffafa, 1); 
    renderer.shadowMap.enabled = true;//se habilitan las sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('TutContainer');
	dom.appendChild(renderer.domElement);

	group = new THREE.Group();
	scene.add( group );

	createText();
	createTreesPool();
	addWorld();
	addHero();
	addLight();
	addExplosion();
	snow();


	camera.position.z = 6.5;
	camera.position.y = 3.5;
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );
	orbitControl.addEventListener( 'change', render );
	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableZoom = false;
	orbitControl.minPolarAngle = 1.1;
	orbitControl.maxPolarAngle = 1.1;
	orbitControl.minAzimuthAngle = -0.2;
	orbitControl.maxAzimuthAngle = 0.2;
	
	window.addEventListener('resize', onWindowResize, false);

	document.onkeydown = handleKeyDown;
	
}

function addExplosion(){
	particleGeometry = new THREE.Geometry();
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		particleGeometry.vertices.push( vertex );
	}
	var pMaterial = new THREE.ParticleBasicMaterial({
	  color: 0xfffafa,
	  size: 0.2
	});
	particles = new THREE.Points( particleGeometry, pMaterial );
	scene.add( particles );
	particles.visible=false;
}

function createTreesPool(){
	var maxTreesInPool=10;
	var newTree;
	for(var i=0; i<maxTreesInPool/2;i++){
		newTree=createTree();
		treesPool.push(newTree);
	}
	for(var i=0; i<maxTreesInPool/2;i++){
		newTree=createTree2();
		treesPool.push(newTree);
	}
}

function handleKeyDown(keyEvent){
	if(jumping)return;
	var validMove=true;
	if ( keyEvent.keyCode === 37) {//izquierda
		if(currentLane==middleLane){
			currentLane=leftLane;
		}else if(currentLane==rightLane){
			currentLane=middleLane;
		}else{
			validMove=false;	
		}
	} else if ( keyEvent.keyCode === 39) {//derecha
		if(currentLane==middleLane){
			currentLane=rightLane;
		}else if(currentLane==leftLane){
			currentLane=middleLane;
		}else{
			validMove=false;	
		}
	}else{
		if ( keyEvent.keyCode === 38){//arriba, salta
			bounceValue=0.1;
			jumping=true;
		}
		validMove=false;
	}

	if(validMove){
		jumping=true;
		bounceValue=0.06;
	}
}

function addHero(){
	var sphereGeometry = new THREE.BoxBufferGeometry( heroRadius, heroRadius, heroRadius);
	let sphereMaterial = new THREE.MeshPhysicalMaterial( {
		clearcoat: 0.5,
		clearcoatRoughness: 0.5,
		metalness: 0.1,
		roughness: 0,
		reflectivity: 1,
		color: 0x49aa7b,
		emissive: 0x990000,
		//normalScale: new THREE.Vector2( 0.15, 0.15 )
	} );
	//var sphereMaterial = new THREE.MeshPhysicalMaterial( { vertexColors: THREE.FaceColors } )
	jumping=false;
	heroSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heroSphere.receiveShadow = true;
	heroSphere.castShadow=true;
	scene.add( heroSphere );
	heroSphere.position.y=heroBaseY;
	heroSphere.position.z=4.8;
	currentLane=middleLane;
	heroSphere.position.x=currentLane;
}

function getTextMesh(text){
	//Number
	var loader = new THREE.FontLoader();
    loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {
	var geometry = new THREE.TextGeometry( text, {
		font: font,
		size: 1,
		height: 1,
		curveSegments: 4,
		bevelEnabled: true,
		bevelThickness: 0.02,
		bevelSize: 0.05,
		bevelSegments: 3
	} );
	geometry.center();
    let counterMesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());

	group.add( counterMesh );
	counterMesh.position.z = -25
	} );
};

function createText() {
	const loader = new THREE.FontLoader();
	loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {
		font = font;
		textGeo = new THREE.TextGeometry( text, {
			font: font,
			size: 5,
			height: 10,
			curveSegments: 4,
			bevelEnabled: true,
			bevelThickness: 0.02,
			bevelSize: 0.05,
			bevelSegments: 3
		} );
		textGeo.center();
		textGeo = new THREE.BufferGeometry().fromGeometry( textGeo );
	
		textMesh1 = new THREE.Mesh( textGeo, new THREE.MeshNormalMaterial() );
	
		group.add( textMesh1 );
		textMesh1.position.z = -25
	})

}

function refreshText() {

	group.remove( textMesh1 );

	if ( ! text ) return;

	createText();

}

function addWorld(){
	var sides=40;
	var tiers=40;
	var sphereGeometry = new THREE.SphereGeometry( worldRadius, sides,tiers);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x09902b ,shading:THREE.FlatShading} )
	
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var nextVertexVector= new THREE.Vector3();
	var firstVertexVector= new THREE.Vector3();
	var offset= new THREE.Vector3();
	var currentTier=1;
	var lerpValue=0.5;
	var heightValue;
	var maxHeight=0.07;
	for(var j=1;j<tiers-2;j++){
		currentTier=j;
		for(var i=0;i<sides;i++){
			vertexIndex=(currentTier*sides)+1;
			vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
			if(j%2!==0){
				if(i==0){
					firstVertexVector=vertexVector.clone();
				}
				nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
				if(i==sides-1){
					nextVertexVector=firstVertexVector;
				}
				lerpValue=(Math.random()*(0.75-0.25))+0.25;
				vertexVector.lerp(nextVertexVector,lerpValue);
			}
			heightValue=(Math.random()*maxHeight)-(maxHeight/2);
			offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
			sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
		}
	}
	rollingGroundSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	rollingGroundSphere.receiveShadow = true;
	rollingGroundSphere.castShadow=false;
	rollingGroundSphere.rotation.z=-Math.PI/2;
	scene.add( rollingGroundSphere );
	rollingGroundSphere.position.y=-24;
	rollingGroundSphere.position.z=2;
	addWorldTrees();
}
function addLight(){
	var hemisphereLight = new THREE.HemisphereLight(0xfffafa,0x000000, .9)
	scene.add(hemisphereLight);
	sun = new THREE.DirectionalLight( 0xcdc1c5, 0.9);
	sun.position.set( 12,6,-7 );
	sun.castShadow = true;
	scene.add(sun);
	//Aqui se configura las sombras para el sol
	sun.shadow.mapSize.width = 256;
	sun.shadow.mapSize.height = 256;
	sun.shadow.camera.near = 0.5;
	sun.shadow.camera.far = 50 ;
}
function addPathTree(){
	var options=[0,1,2];
	var lane= Math.floor(Math.random()*3);
	addTree(true,lane);
	options.splice(lane,2);
	if(Math.random()>0.6){
		lane= Math.floor(Math.random()*2);
		addTree(true,options[lane]);
	}
}
function addWorldTrees(){
	var numTrees=80;
	var gap=9.28/80;
	for(var i=0;i<numTrees;i++){
		addTree(false,i*gap, true);
		addTree(false,i*gap, false);
	}
}
function addTree(inPath, row, isLeft){
	var newTree;
	if(inPath){
		if(treesPool.length==0)return;
		newTree=treesPool.pop();
		newTree.visible=true;
		treesInPath.push(newTree);
		sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
	}else{
		newTree=createTree();
		var forestAreaAngle=0;//[1.52,1.57,1.62];
		if(isLeft){
			forestAreaAngle=1.68+Math.random()*0.1;
		}else{
			forestAreaAngle=1.46-Math.random()*0.1;
		}
		sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
	}
	newTree.position.setFromSpherical( sphericalHelper );
	var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
	var treeVector=newTree.position.clone().normalize();
	newTree.quaternion.setFromUnitVectors(treeVector,rollingGroundVector);
	newTree.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;
	
	rollingGroundSphere.add(newTree);
}
function createTree(){
	var sides=8;
	var tiers=6;
	var scalarMultiplier=(Math.random()*(0.25-0.1))+0.05;
	var treeGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
	var treeMaterial = new THREE.MeshStandardMaterial( { color: 0x33ff33,shading:THREE.FlatShading  } );

	midPointVector=treeGeometry.vertices[0].clone();

	blowUpTree(treeGeometry.vertices,sides,0,scalarMultiplier);
	tightenTree(treeGeometry.vertices,sides,1);
	blowUpTree(treeGeometry.vertices,sides,2,scalarMultiplier*1.1,true);
	tightenTree(treeGeometry.vertices,sides,3);
	blowUpTree(treeGeometry.vertices,sides,4,scalarMultiplier*1.2);
	tightenTree(treeGeometry.vertices,sides,5);
	var treeTop = new THREE.Mesh( treeGeometry, treeMaterial );
	treeTop.castShadow=true;
	treeTop.receiveShadow=false;
	treeTop.position.y=0.9;
	treeTop.rotation.y=(Math.random()*(Math.PI));
	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
	var trunkMaterial = new THREE.MeshStandardMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, trunkMaterial );
	treeTrunk.position.y=0.25;
	var tree =new THREE.Object3D();
	tree.add(treeTrunk);
	tree.add(treeTop);
	return tree;
}

function createTree2() {
	// tree
	var tree = new THREE.Group();
	var trunkGeometry = new THREE.CylinderBufferGeometry(0.2, 0.8, 1.5);
	var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x49311c });
	var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
	tree.add(trunk);

	// leaves
	var leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x3d5e3a });

	var leavesCone= new THREE.ConeBufferGeometry(0.7, 1.5, 6);
	var leavesBottom = new THREE.Mesh(leavesCone, leavesMaterial);
	leavesBottom.position.y = 1.5;
	tree.add(leavesBottom);

	var box = new THREE.Box3().setFromObject( leavesBottom );
	addRingOfLights(leavesBottom, 0.3, 0.5, -.5)

	var middleLeaveCone = new THREE.ConeBufferGeometry(0.8, 1.5, 6);    
	var leavesMiddle = new THREE.Mesh(middleLeaveCone, leavesMaterial );
	leavesMiddle.position.y = 1.95;
	tree.add(leavesMiddle);

	addRingOfLights(leavesMiddle, 0.4, 0.5, -0.3)

	var topLeaveCone = new THREE.ConeBufferGeometry(0.5, 1, 6);  
	var leavesTop = new THREE.Mesh(topLeaveCone, leavesMaterial);
	leavesTop.position.y = 2.5;
	tree.add(leavesTop);

	addRingOfLights(leavesTop, 0.35, 0.4, -0.3)

	return tree
}

function addRingOfLights(thing, left, right, y) {
    let group = new THREE.Group();
    let light = christmasLight(left, y, 0, randomChristmasColor())  
    let light2 = christmasLight(-left, y, 0, randomChristmasColor())  
    let light3 = christmasLight(0, y, right, randomChristmasColor())  
    let light4 = christmasLight(0, y, -right, randomChristmasColor())  
    group.add( light );
    group.add( light2 );
    group.add( light3 );
    group.add( light4 );
    thing.add(group);
}

function christmasLight(x,y,z, color) {
	var bulbGeometry = new THREE.SphereBufferGeometry( 0.10, 16, 8 );
	bulbMat = new THREE.MeshStandardMaterial( {
		emissive:color || 0xffffee,
		emissiveIntensity: 3,
		color: color || 0x000000
	} );
	const bulbMesh = new THREE.Mesh( bulbGeometry, bulbMat );
	bulbMesh.position.set(x,y,z);
	return bulbMesh;
}

function randomChristmasColor() {
	const numOfLightColors = lightColors.length;
	const color = lightColors[getRandomInt(0, numOfLightColors - 1)];
	return color;
}

function blowUpTree(vertices,sides,currentTier,scalarMultiplier,odd){
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var midPointVector=vertices[0].clone();
	var offset;
	for(var i=0;i<sides;i++){
		vertexIndex=(currentTier*sides)+1;
		vertexVector=vertices[i+vertexIndex].clone();
		midPointVector.y=vertexVector.y;
		offset=vertexVector.sub(midPointVector);
		if(odd){
			if(i%2===0){
				offset.normalize().multiplyScalar(scalarMultiplier/6);
				vertices[i+vertexIndex].add(offset);
			}else{
				offset.normalize().multiplyScalar(scalarMultiplier);
				vertices[i+vertexIndex].add(offset);
				vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
			}
		}else{
			if(i%2!==0){
				offset.normalize().multiplyScalar(scalarMultiplier/6);
				vertices[i+vertexIndex].add(offset);
			}else{
				offset.normalize().multiplyScalar(scalarMultiplier);
				vertices[i+vertexIndex].add(offset);
				vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
			}
		}
	}
}

function tightenTree(vertices,sides,currentTier){
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var midPointVector=vertices[0].clone();
	var offset;
	for(var i=0;i<sides;i++){
		vertexIndex=(currentTier*sides)+1;
		vertexVector=vertices[i+vertexIndex].clone();
		midPointVector.y=vertexVector.y;
		offset=vertexVector.sub(midPointVector);
		offset.normalize().multiplyScalar(0.06);
		vertices[i+vertexIndex].sub(offset);
	}
}

function update(){
    rollingGroundSphere.rotation.x += rollingSpeed;
    heroSphere.rotation.x -= heroRollingSpeed;
    if(heroSphere.position.y<=heroBaseY){
    	jumping=false;
    	bounceValue=(Math.random()*0.04)+0.005;
    }
    heroSphere.position.y+=bounceValue;
    heroSphere.position.x=THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());
    bounceValue-=gravity; //se ajusta que la gravedad sea negativa
    if(clock.getElapsedTime()>treeReleaseInterval){
    	clock.start();
    	addPathTree();
	}
	if(Math.round(clock2.getElapsedTime())%3 == 0 && counterTime != Math.round(clock2.getElapsedTime())){
		counterTime = Math.round(clock2.getElapsedTime())
		text = String((text - '0') + 1)
		refreshText();
	}
    doTreeLogic();
    doExplosionLogic();
	makeItSnow();
	render();
	requestAnimationFrame(update);//pide otro update
}

function doTreeLogic(){
	var oneTree;
	var treePos = new THREE.Vector3();
	var treesToRemove=[];
	treesInPath.forEach( function ( element, index ) {
		oneTree=treesInPath[ index ];
		treePos.setFromMatrixPosition( oneTree.matrixWorld );
		if(treePos.z>6 &&oneTree.visible){
			treesToRemove.push(oneTree);
		}else{//valida si choco
			if(treePos.distanceTo(heroSphere.position)<=0.6){
				hasCollided=true;
				explode();
			}
		}
	});
	var fromWhere;
	treesToRemove.forEach( function ( element, index ) {
		oneTree=treesToRemove[ index ];
		fromWhere=treesInPath.indexOf(oneTree);
		treesInPath.splice(fromWhere,1);
		treesPool.push(oneTree);
		oneTree.visible=false;
	});
}

function doExplosionLogic(){
	if(!particles.visible)return;
	for (var i = 0; i < particleCount; i ++ ) {
		particleGeometry.vertices[i].multiplyScalar(explosionPower);
	}
	if(explosionPower>1.005){
		explosionPower-=0.001;
	}else{
		particles.visible=false;
	}
	particleGeometry.verticesNeedUpdate = true;
}

function explode(){
	particles.position.y=2;
	particles.position.z=4.8;
	particles.position.x=heroSphere.position.x;
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = -0.2+Math.random() * 0.4;
		vertex.y = -0.2+Math.random() * 0.4 ;
		vertex.z = -0.2+Math.random() * 0.4;
		particleGeometry.vertices[i]=vertex;
	}
	explosionPower=1.07;
	particles.visible=true;
}

function snow() {
	let loader = new THREE.TextureLoader();
		loader.crossOrigin = '';
	particleCountSnow = 1500;
	let pMaterial = new THREE.PointCloudMaterial({
		color: 0xFFFFFF,
		size: 1.5,
		map: loader.load(
			"https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/sprites/snowflake2.png"
		),
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
		});

	particlesSnow = new THREE.Geometry;
	for (var i = 0; i < particleCountSnow; i++) {
		var pX = Math.random()*500 - 250,
			pY = Math.random()*500 - 250,
			pZ = Math.random()*500 - 250,
			particle = new THREE.Vector3(pX, pY, pZ);
		particle.velocity = {};
		particle.velocity.y = 0;
		particlesSnow.vertices.push(particle);
	}
	particleSystem = new THREE.PointCloud(particlesSnow, pMaterial);
	particleSystem.position.x = 100;
	particleSystem.position.y = 100;
	scene.add(particleSystem);
}

function makeItSnow() {
	var pCount = particleCountSnow;
	while (pCount--) {
		var particle = particlesSnow.vertices[pCount];
		if (particle.y < -200) {
			particle.y = 200;
			particle.velocity.y = 0;
		}
		particle.velocity.y -= Math.random() * .02;
		particle.y += particle.velocity.y;
	}
	particlesSnow.verticesNeedUpdate = true;
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