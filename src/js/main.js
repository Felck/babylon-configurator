class Configurator {
  #meshes = [];
  #materials = [];
  #textures = [{
    name: "None",
    diffuseTexture: null,
    bumpTexture: null
  }];

  addMesh(mesh, materialIndex) {
    this.#meshes.push({ mesh: mesh, materialData: this.#materials[materialIndex] });
  }

  addMaterial(material, textureIndex = 0) {
    this.#materials.push({ material: material, textureIndex: textureIndex });
  }

  addTexture(name, diffuseTexture = null, bumpTexture = null) {
    this.#textures.push({
      name: name,
      diffuseTexture: diffuseTexture,
      bumpTexture: bumpTexture
    });
  }

  setMaterial(meshIndex, materialIndex) {
    const materialData = this.#materials[materialIndex];
    const meshData = this.#meshes[meshIndex]
    meshData.mesh.material = materialData.material;
    meshData.materialData = materialData;

    return materialData.textureIndex;
  }

  setTexture(meshIndex, textureIndex) {
    const textureData = this.#textures[textureIndex];
    const meshData = this.#meshes[meshIndex];
    meshData.mesh.material.diffuseTexture = textureData.diffuseTexture;
    meshData.mesh.material.bumpTexture = textureData.bumpTexture;
    meshData.materialData.textureIndex = textureIndex;
  }

  haveSameMaterial(mesh1, mesh2) {
    return this.#meshes[mesh1].materialData === this.#meshes[mesh2].materialData;
  }

  get materials() { return this.#materials; }

  get textures() { return this.#textures; }
}

const configurator = new Configurator();
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(60), BABYLON.Tools.ToRadians(70), 300, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 100, 0), scene);
  light.intensity = 0.7;

  const mat0 = new BABYLON.StandardMaterial("Default", scene);
  configurator.addMaterial(mat0);

  const mat1 = new BABYLON.StandardMaterial("Diffuse Blue", scene);
  mat1.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
  configurator.addMaterial(mat1);

  const mat2 = new BABYLON.StandardMaterial("Diffuse Yellow", scene);
  mat2.diffuseColor = new BABYLON.Color3(1, 1, 0.5);
  configurator.addMaterial(mat2);

  const mat3 = new BABYLON.StandardMaterial("Wireframe", scene);
  mat3.wireframe = true;
  configurator.addMaterial(mat3);

  configurator.addTexture("Stones",
    new BABYLON.Texture("assets/textures/floor.png", scene),
    new BABYLON.Texture("assets/textures/floorn.png", scene));

  configurator.addTexture("Rock",
    new BABYLON.Texture("assets/textures/rock.png", scene),
    new BABYLON.Texture("assets/textures/rockn.png", scene))

  BABYLON.OBJFileLoader.COMPUTE_NORMALS = true;
  BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "teapot.obj", scene, function (meshes) {
    configurator.addMesh(meshes[0], 0);
    configurator.addMesh(meshes[1], 0);
  });

  return scene;
};

const initControlPanel = function () {
  const lidMatSelect = document.getElementById("lid-mat");
  const potMatSelect = document.getElementById("pot-mat");
  const lidTexSelect = document.getElementById("lid-tex");
  const potTexSelect = document.getElementById("pot-tex");

  // populate dropdowns
  for (let i = 0; i < configurator.materials.length; i++) {
    const el = document.createElement("option");
    el.text = configurator.materials[i].material.name;
    el.value = i;

    lidMatSelect.add(el.cloneNode(true));
    potMatSelect.add(el);
  }

  for (let i = 0; i < configurator.textures.length; i++) {
    const el = document.createElement("option");
    el.text = configurator.textures[i].name;
    el.value = i;

    lidTexSelect.add(el.cloneNode(true));
    potTexSelect.add(el);
  }

  // event listeners
  lidMatSelect.addEventListener("change", function () {
    lidTexSelect.value = configurator.setMaterial(1, this.value);
  });

  potMatSelect.addEventListener("change", function () {
    potTexSelect.value = configurator.setMaterial(0, this.value);
  });

  lidTexSelect.addEventListener("change", function () {
    configurator.setTexture(1, this.value);
    if (configurator.haveSameMaterial(0, 1)) {
      potTexSelect.value = this.value;
    }
  });

  potTexSelect.addEventListener("change", function () {
    configurator.setTexture(0, this.value);
    if (configurator.haveSameMaterial(0, 1)) {
      lidTexSelect.value = this.value;
    }
  })
}

const scene = createScene();

initControlPanel();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});