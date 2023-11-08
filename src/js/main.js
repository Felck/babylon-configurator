/**
 * Mesh wrapper
 * @typedef {{ mesh: BABYLON.Mesh, materialData: ?MaterialData }} MeshData
 * 
 * Material wrapper
 * @typedef {{ material: BABYLON.Material, textureIndex: number }} MaterialData
 *
 * Texture wrapper
 * @typedef {{ name: string, diffuseTexture: BABYLON.Texture, bumpTexture: BABYLON.Texture }} TextureData
 */

class Configurator {
  /** @type { MeshData[] } */
  #meshes = [];
  /** @type { MaterialData[] } */
  #materials = [];
  /** @type { TextureData[] } */
  #textures = [{
    name: "None",
    diffuseTexture: null,
    bumpTexture: null
  }];

  /**
   * Add a mesh and optionally assign a material to it.
   * @param { BABYLON.Mesh } mesh 
   * @param { ?number } materialIndex Index into #meshes or null
   */
  addMesh(mesh, materialIndex = null) {
    if (materialIndex === null) {
      this.#meshes.push({ mesh: mesh, materialData: null });
    } else {
      const materialData = this.#materials[materialIndex];
      mesh.material = materialData.material;
      this.#meshes.push({ mesh: mesh, materialData: materialData });
    }
  }

  /**
   * Add a material.
   * @param { BABYLON.Material } material 
   */
  addMaterial(material) {
    this.#materials.push({ material: material, textureIndex: 0 });
  }

  /**
   * Add a texture.
   * @param { string } name 
   * @param { BABYLON.Texture } diffuseTexture 
   * @param { BABYLON.Texture } bumpTexture 
   */
  addTexture(name, diffuseTexture = null, bumpTexture = null) {
    this.#textures.push({
      name: name,
      diffuseTexture: diffuseTexture,
      bumpTexture: bumpTexture
    });
  }

  /**
   * Assign a material to a mesh.
   * @param { number } meshIndex Index into #meshes
   * @param { number } materialIndex Index into #materials
   * @returns { number } Index of the texture assigned to the selected material.
   */
  setMaterial(meshIndex, materialIndex) {
    const materialData = this.#materials[materialIndex];
    const meshData = this.#meshes[meshIndex];
    meshData.mesh.material = materialData.material;
    meshData.materialData = materialData;

    return materialData.textureIndex;
  }

  /**
   * Assign a texture to a meshes material.
   * @param { number } meshIndex Index into #meshes
   * @param { number } textureIndex Index into #textures
   */
  setTexture(meshIndex, textureIndex) {
    const textureData = this.#textures[textureIndex];
    const meshData = this.#meshes[meshIndex];
    meshData.mesh.material.diffuseTexture = textureData.diffuseTexture;
    meshData.mesh.material.bumpTexture = textureData.bumpTexture;
    meshData.materialData.textureIndex = textureIndex;
  }

  /**
   * Check if the two meshes have the same texture assigned.
   * @param { number } mesh1 Index into #meshes
   * @param { number } mesh2 Index into #meshes
   * @returns { boolean } True if both meshes use the same texture
   */
  haveSameMaterial(mesh1, mesh2) {
    return this.#meshes[mesh1].materialData === this.#meshes[mesh2].materialData;
  }

  get materials() { return this.#materials; }

  get textures() { return this.#textures; }
}

/**
 * Creates a material with custom vertex and fragment shaders.
 * @param { BABYLON.Scene } scene
 * @returns { BABYLON.ShaderMaterial } Created material
 */
const createShaderMaterial = function (scene) {
  BABYLON.Effect.ShadersStore['colorSineVertexShader'] = `
    precision highp float;
    attribute vec3 position;
    uniform mat4 worldViewProjection;
    out vec3 vPosition;
    
    void main() {
      vPosition = position;
      vec4 p = vec4(position, 1.);
      gl_Position = worldViewProjection * p;
    }
  `;

  BABYLON.Effect.ShadersStore['colorSineFragmentShader'] = `
    precision highp float;
    in vec3 vPosition;
    uniform float time;

    void main() {
      gl_FragColor = vec4(sin(vPosition.x + time), sin(vPosition.y + time), sin(vPosition.z + time), 1.);
    }
  `;

  const shaderMaterial = new BABYLON.ShaderMaterial(
    'Color Sine',
    scene,
    'colorSine',
    {
      attributes: ["position"],
      uniforms: ["worldViewProjection", "time"]
    }
  );

  // Update time uniform
  let time = 0;
  scene.registerBeforeRender(function () {
    shaderMaterial.setFloat("time", time);
    time += scene.getEngine().getDeltaTime() / 500.0;
  });

  return shaderMaterial;
};

const configurator = new Configurator();
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(60), BABYLON.Tools.ToRadians(70), 300, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 100, 0), scene);
  light.intensity = 0.7;

  const matDefault = new BABYLON.StandardMaterial("Default", scene);
  configurator.addMaterial(matDefault);

  const matBlue = new BABYLON.StandardMaterial("Diffuse Blue", scene);
  matBlue.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
  configurator.addMaterial(matBlue);

  const matYellow = new BABYLON.StandardMaterial("Diffuse Yellow", scene);
  matYellow.diffuseColor = new BABYLON.Color3(1, 1, 0.5);
  configurator.addMaterial(matYellow);

  const matWireframe = new BABYLON.StandardMaterial("Wireframe", scene);
  matWireframe.wireframe = true;
  configurator.addMaterial(matWireframe);

  configurator.addMaterial(createShaderMaterial(scene));

  configurator.addTexture("Stones",
    new BABYLON.Texture("assets/textures/floor.png", scene),
    new BABYLON.Texture("assets/textures/floorn.png", scene));

  configurator.addTexture("Rock",
    new BABYLON.Texture("assets/textures/rock.png", scene),
    new BABYLON.Texture("assets/textures/rockn.png", scene));

  const marbleTexture = new BABYLON.MarbleProceduralTexture("marbleTex", 512, scene);
  marbleTexture.numberOfTilesHeight = 3;
  marbleTexture.numberOfTilesWidth = 3;
  configurator.addTexture("Procedural Marble", marbleTexture, null);

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
  });
};

const scene = createScene();

initControlPanel();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});