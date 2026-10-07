"use client";

import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";

import { OrbitControls } from "@react-three/drei";

import * as THREE from "three";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   STAR FIELD
========================================================= */

function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 230;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] =
        (Math.random() - 0.5) * 16;

      positions[i * 3 + 1] =
        (Math.random() - 0.5) * 10;

      positions[i * 3 + 2] =
        (Math.random() - 0.5) * 9 - 1;
    }

    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        positions,
        3
      )
    );

    return geo;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y =
      state.clock.elapsedTime * 0.00045;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
    >
      <pointsMaterial
        color="#dcecff"
        size={0.020}
        transparent
        opacity={0.68}
        depthWrite={false}
      />
    </points>
  );
}

/* =========================================================
   ORBIT PATH
========================================================= */

function OrbitPath({
  radius,
  tube,
  color,
  rotation,
  speed,
  opacity = 0.9,
}: {
  radius: number;
  tube: number;
  color: string;
  rotation: [number, number, number];
  speed: number;
  opacity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.z +=
      delta * speed;
  });

  return (
    <mesh
      ref={ref}
      rotation={rotation}
    >
      <torusGeometry
        args={[
          radius,
          tube,
          12,
          240,
        ]}
      />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* =========================================================
   ORBIT GLOW
========================================================= */

function OrbitGlow() {
  return (
    <group>

      {/* MAIN CYAN */}

      <OrbitPath
        radius={1.70}
        tube={0.012}
        color="#28e7ff"
        rotation={[0.52, 0.12, 0]}
        speed={0.018}
        opacity={0.95}
      />

      {/* MAIN VIOLET */}

      <OrbitPath
        radius={1.86}
        tube={0.009}
        color="#aa72ff"
        rotation={[-0.58, 0.42, 0]}
        speed={-0.014}
        opacity={0.90}
      />

      {/* SECOND CYAN */}

      <OrbitPath
        radius={1.98}
        tube={0.007}
        color="#25bfff"
        rotation={[0.92, -0.28, 0.2]}
        speed={0.010}
        opacity={0.82}
      />

      {/* SECOND VIOLET */}

      <OrbitPath
        radius={2.08}
        tube={0.005}
        color="#b478ff"
        rotation={[0.18, 0.88, 0]}
        speed={-0.007}
        opacity={0.68}
      />

      {/* THIN OUTER CYAN */}

      <OrbitPath
        radius={2.18}
        tube={0.0035}
        color="#55ddff"
        rotation={[-0.25, -0.72, 0.15]}
        speed={0.005}
        opacity={0.55}
      />

    </group>
  );
}

/* =========================================================
   ORBIT PARTICLES
========================================================= */

function OrbitParticles() {
  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.z =
      state.clock.elapsedTime * 0.010;
  });

  const particles = [
    [1.70, 0.0, 0],
    [-1.70, 0.0, 0],
    [1.22, 1.08, 0],
    [-1.22, -1.08, 0],
    [1.18, -1.12, 0],
    [-1.18, 1.12, 0],
    [1.93, 0.42, 0],
    [-1.93, -0.42, 0],
  ];

  return (
    <group
      ref={groupRef}
      rotation={[0.52, 0.12, 0]}
    >
      {particles.map(
        (position, index) => (
          <mesh
            key={index}
            position={
              position as [
                number,
                number,
                number
              ]
            }
          >
            <sphereGeometry
              args={[
                index % 3 === 0
                  ? 0.035
                  : 0.025,
                12,
                12,
              ]}
            />

            <meshBasicMaterial
              color={
                index % 2 === 0
                  ? "#45edff"
                  : "#b98aff"
              }
              toneMapped={false}
            />
          </mesh>
        )
      )}
    </group>
  );
}

/* =========================================================
   EARTH
========================================================= */

function Earth() {
  const earthRef =
    useRef<THREE.Mesh>(null);

  const cloudsRef =
    useRef<THREE.Mesh>(null);

  const lightsRef =
    useRef<THREE.Mesh>(null);

  const lightsGlowRef =
    useRef<THREE.Mesh>(null);

  const { size } = useThree();

  const isMobile =
    size.width < 700;

  /*
    Bigger Earth for premium hero composition.
  */

  const earthScale =
    isMobile ? 0.88 : 1.05;

  const earthMap = useLoader(
    THREE.TextureLoader,
    "/textures/earth.jpg"
  );

  const cloudMap = useLoader(
    THREE.TextureLoader,
    "/textures/clouds.png"
  );

  const normalMap = useLoader(
    THREE.TextureLoader,
    "/textures/earth-normal.jpg"
  );

  const specularMap = useLoader(
    THREE.TextureLoader,
    "/textures/earth-specular.jpg"
  );

  const lightsMap = useLoader(
    THREE.TextureLoader,
    "/textures/earth-lights.png"
  );

  earthMap.colorSpace =
    THREE.SRGBColorSpace;

  cloudMap.colorSpace =
    THREE.SRGBColorSpace;

  lightsMap.colorSpace =
    THREE.SRGBColorSpace;

  useFrame((_, delta) => {

    /* EARTH */

    if (earthRef.current) {
      earthRef.current.rotation.y +=
        delta * 0.028;
    }

    /* CLOUDS */

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y +=
        delta * 0.021;
    }

    /* CITY LIGHTS */

    if (lightsRef.current) {
      lightsRef.current.rotation.y +=
        delta * 0.028;
    }

    if (lightsGlowRef.current) {
      lightsGlowRef.current.rotation.y +=
        delta * 0.028;
    }
  });

  return (
    <group scale={earthScale}>

      {/* =================================================
          OUTER BLUE AURA
      ================================================= */}

      <mesh scale={1.20}>
        <sphereGeometry
          args={[1.18, 96, 96]}
        />

        <meshBasicMaterial
          color="#168cff"
          transparent
          opacity={0.095}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* =================================================
          CYAN AURA
      ================================================= */}

      <mesh scale={1.145}>
        <sphereGeometry
          args={[1.18, 96, 96]}
        />

        <meshBasicMaterial
          color="#32dfff"
          transparent
          opacity={0.17}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* =================================================
          BRIGHT INNER ATMOSPHERE
      ================================================= */}

      <mesh scale={1.105}>
        <sphereGeometry
          args={[1.18, 96, 96]}
        />

        <meshBasicMaterial
          color="#5eeaff"
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* =================================================
          REAL EARTH
      ================================================= */}

      <mesh ref={earthRef}>

        <sphereGeometry
          args={[1.18, 128, 128]}
        />

        <meshPhongMaterial
          map={earthMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={
            new THREE.Color("#83cfff")
          }
          shininess={28}
          emissive={
            new THREE.Color("#031426")
          }
          emissiveIntensity={0.18}
        />

      </mesh>

      {/* =================================================
          BRIGHT CITY LIGHTS
      ================================================= */}

      <mesh
        ref={lightsRef}
        scale={1.010}
      >

        <sphereGeometry
          args={[1.18, 128, 128]}
        />

        <meshBasicMaterial
          map={lightsMap}
          color="#fff0a0"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />

      </mesh>

      {/* =================================================
          CITY LIGHT OUTER GLOW
      ================================================= */}

      <mesh
        ref={lightsGlowRef}
        scale={1.018}
      >

        <sphereGeometry
          args={[1.18, 128, 128]}
        />

        <meshBasicMaterial
          map={lightsMap}
          color="#ffcf55"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />

      </mesh>

      {/* =================================================
          CLOUD LAYER
      ================================================= */}

      <mesh
        ref={cloudsRef}
        scale={1.020}
      >

        <sphereGeometry
          args={[1.18, 128, 128]}
        />

        <meshPhongMaterial
          map={cloudMap}
          transparent
          opacity={0.20}
          depthWrite={false}
        />

      </mesh>

      {/* =================================================
          ATMOSPHERE EDGE
      ================================================= */}

      <mesh scale={1.072}>

        <sphereGeometry
          args={[1.18, 128, 128]}
        />

        <meshBasicMaterial
          color="#72e5ff"
          transparent
          opacity={0.23}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />

      </mesh>

      {/* =================================================
          LIGHTING
      ================================================= */}

      <directionalLight
        position={[4, 3, 5]}
        intensity={3.2}
        color="#ffffff"
      />

      <directionalLight
        position={[-4, 1, 2]}
        intensity={0.85}
        color="#268fff"
      />

      <pointLight
        position={[0, 0, 3]}
        color="#29bfff"
        intensity={1.5}
        distance={6}
      />

      <pointLight
        position={[-2, 1, 2]}
        color="#43dcff"
        intensity={0.8}
        distance={5}
      />

    </group>
  );
}

/* =========================================================
   CONNECTION LINES
========================================================= */

function ConnectionLines() {

  const objects = useMemo(() => {

    const createLine = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      color: string,
      opacity: number
    ) => {

      const geometry =
        new THREE.BufferGeometry()
          .setFromPoints([
            start,
            end,
          ]);

      const material =
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending:
            THREE.AdditiveBlending,
        });

      return new THREE.Line(
        geometry,
        material
      );
    };

    return [
      createLine(
        new THREE.Vector3(
          -3.0,
          1.0,
          0
        ),
        new THREE.Vector3(
          -1.0,
          0.42,
          0.2
        ),
        "#35eaff",
        0.72
      ),

      createLine(
        new THREE.Vector3(
          3.0,
          1.0,
          0
        ),
        new THREE.Vector3(
          1.0,
          0.42,
          0.2
        ),
        "#a97aff",
        0.68
      ),

      createLine(
        new THREE.Vector3(
          -3.0,
          -1.0,
          0
        ),
        new THREE.Vector3(
          -0.95,
          -0.42,
          0.2
        ),
        "#35eaff",
        0.72
      ),

      createLine(
        new THREE.Vector3(
          3.0,
          -1.0,
          0
        ),
        new THREE.Vector3(
          0.95,
          -0.42,
          0.2
        ),
        "#a97aff",
        0.68
      ),
    ];

  }, []);

  useEffect(() => {
    return () => {
      objects.forEach((object) => {
        object.geometry.dispose();

        const material =
          object.material;

        if (material instanceof THREE.Material) {
          material.dispose();
        }
      });
    };
  }, [objects]);

  return (
    <group>
      {objects.map(
        (object, index) => (
          <primitive
            key={index}
            object={object}
          />
        )
      )}
    </group>
  );
}

/* =========================================================
   SCENE
========================================================= */

function Scene() {

  const [mobile, setMobile] =
    useState(false);

  useEffect(() => {

    const check = () => {
      setMobile(
        window.innerWidth < 700
      );
    };

    check();

    window.addEventListener(
      "resize",
      check
    );

    return () =>
      window.removeEventListener(
        "resize",
        check
      );

  }, []);

  return (
    <>
      <color
        attach="background"
        args={["#020713"]}
      />

      <ambientLight
        intensity={0.18}
      />

      <StarField />

      <Earth />

      <OrbitGlow />

      <OrbitParticles />

      <ConnectionLines />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.10}
        autoRotate={!mobile}
        autoRotateSpeed={0.045}
        enableRotate={!mobile}
      />

    </>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  type,
  icon,
  title,
  description,
  href,
}: {
  type: "cyan" | "violet" | "blue";
  icon: string;
  title: string;
  description: string;
  href: string;
}) {

  return (
    <button
      type="button"
      className={`feature-card ${type}`}
      onClick={() => {
        const token =
          window.localStorage.getItem("nexora_access_token") ||
          window.sessionStorage.getItem("nexora_access_token");

        window.location.href = token
          ? href
          : "/login";
      }}
      aria-label={title}
    >

      <div className="feature-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <span className="feature-arrow">
        →
      </span>

    </button>
  );
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {

  return (
    <main className="nexora">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="brand">
          NEXORA
        </div>

        <div className="online">
          <span />
          SYSTEM ONLINE
        </div>

      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">

        <div className="eyebrow">
          AI BUSINESS INTELLIGENCE
        </div>

        <h1>

          YOUR BUSINESS

          <br />

          DESERVES MORE

          <br />

          <span>
            THAN DATA.
          </span>

        </h1>

        <p>
          Intelligence that sees what matters,
          understands why it matters, and helps
          you act before problems become expensive.
        </p>

        <button
  type="button"
  className="enter"
  onClick={() => {
    window.location.href = "/language";
  }}
>

          <span>
            ENTER NEXORA
          </span>

          <b>
            →
          </b>

        </button>

      </section>

      {/* =================================================
          INTELLIGENCE CORE
      ================================================= */}

      <section className="intelligence">

        <div className="core-title">

          <span>
            NEXORA
          </span>

          <strong>
            INTELLIGENCE CORE
          </strong>

        </div>

        <div className="live">

          <i />

          LIVE INTELLIGENCE

        </div>

        <div className="core-stage">

          <Canvas
            camera={{
              position: [
                0,
                0,
                5.9,
              ],
              fov: 42,
            }}
            dpr={[1, 1.35]}
            gl={{
              antialias: true,
              alpha: true,
            }}
            style={{
              touchAction: "pan-y",
              pointerEvents: "none",
            }}
          >

            <Scene />

          </Canvas>

          {/* REVENUE */}

          <div className="module module-left module-top">

            <div className="module-icon cyan">
              ▮▮▮
            </div>

            <span>
              REVENUE
            </span>

          </div>

          {/* INVENTORY */}

          <div className="module module-right module-top">

            <div className="module-icon violet">
              ◇
            </div>

            <span>
              INVENTORY
            </span>

          </div>

          {/* CUSTOMERS */}

          <div className="module module-left module-bottom">

            <div className="module-icon cyan">
              ●●
            </div>

            <span>
              CUSTOMERS
            </span>

          </div>

          {/* FINANCE */}

          <div
            className="module module-right module-bottom"
            role="link"
            tabIndex={0}
            onClick={() => {
              window.location.href = "/finance";
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.location.href = "/finance";
              }
            }}
            style={{ cursor: "pointer" }}
          >

            <div className="module-icon violet">
              ≡
            </div>

            <span>
              FINANCE
            </span>

          </div>

        </div>

      </section>

      {/* =================================================
          FEATURE CARDS
      ================================================= */}

      <section className="cards-shell">

        <div className="cards">

          <FeatureCard
            type="cyan"
            icon="✦"
            title="AI COPILOT"
            description="Get instant insights and recommendations."
            href="/dashboard"
          />

          <FeatureCard
            type="violet"
            icon="◇"
            title="INTELLIGENCE"
            description="Real-time analysis for better decisions."
            href="/intelligence"
          />

          <FeatureCard
            type="blue"
            icon="♢"
            title="ALERTS"
            description="Stay ahead with smart notifications."
            href="/alerts"
          />

          <FeatureCard
            type="cyan"
            icon="◎"
            title="AI CORE"
            description="Explore the intelligence engine."
            href="/decision-engine"
          />

        </div>

      </section>

      {/* =================================================
          STATUS
      ================================================= */}

      <section className="status">

        <div className="status-item">

          <span className="status-symbol green">
            ●
          </span>

          <div>

            <small>
              STATUS
            </small>

            <strong>
              INTELLIGENCE ACTIVE
            </strong>

          </div>

        </div>

        <div className="status-item">

          <span className="status-symbol">
            ▣
          </span>

          <div>

            <small>
              ENGINE
            </small>

            <strong>
              NEXORA AI v1.0
            </strong>

          </div>

        </div>

        <div className="status-item">

          <span className="status-symbol green">
            ♢
          </span>

          <div>

            <small>
              SECURITY
            </small>

            <strong>
              PROTECTED
            </strong>

          </div>

        </div>

      </section>

      {/* =================================================
          CSS
      ================================================= */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html {
          margin: 0;
          padding: 0;
          background: #020713;
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
          overflow-x: hidden;
          background: #020713;
          color: white;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font-family: inherit;
        }

        /* =================================================
           MAIN BACKGROUND
        ================================================= */

        .nexora {
          position: relative;
          min-height: 100vh;
          overflow-x: clip;

          background:

            radial-gradient(
              ellipse at 50% 38%,
              rgba(18, 105, 175, .24),
              transparent 29%
            ),

            radial-gradient(
              ellipse at 13% 57%,
              rgba(52, 35, 130, .15),
              transparent 28%
            ),

            radial-gradient(
              ellipse at 88% 60%,
              rgba(21, 75, 137, .15),
              transparent 28%
            ),

            linear-gradient(
              180deg,
              #020713 0%,
              #01050e 48%,
              #020711 100%
            );
        }

        .nexora::before {
          content: "";

          position: absolute;
          inset: 0;

          pointer-events: none;
          z-index: 0;

          background-image:

            radial-gradient(
              circle,
              rgba(255,255,255,.82) .65px,
              transparent 1px
            ),

            radial-gradient(
              circle,
              rgba(65,177,255,.55) .55px,
              transparent 1px
            );

          background-size:
            165px 165px,
            255px 255px;

          background-position:
            20px 25px,
            90px 130px;

          opacity: .34;
        }

        .nexora::after {
          content: "";

          position: absolute;

          left: 50%;
          top: 690px;

          width: 1000px;
          height: 600px;

          transform:
            translateX(-50%);

          pointer-events: none;

          background:
            radial-gradient(
              ellipse,
              rgba(18,145,255,.13),
              transparent 68%
            );

          filter: blur(35px);
        }

        /* =================================================
           HEADER
        ================================================= */

        .header {
          position: relative;
          z-index: 20;

          width:
            min(
              1400px,
              calc(100% - 90px)
            );

          margin: auto;

          padding-top: 34px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          font-size: 31px;
          font-weight: 800;
          letter-spacing: 8px;
        }

        .online {
          display: flex;
          align-items: center;
          gap: 12px;

          color: #8e9db2;

          font-size: 12px;
          letter-spacing: 3px;
        }

        .online span {
          width: 10px;
          height: 10px;

          border-radius: 50%;

          background: #25e4ff;

          box-shadow:
            0 0 10px #25e4ff,
            0 0 25px
            rgba(37,228,255,.75);
        }

        /* =================================================
           HERO
        ================================================= */

        .hero {
          position: relative;
          z-index: 10;

          max-width: 1050px;

          margin: 60px auto 0;

          padding: 0 25px;

          text-align: center;
        }

        .eyebrow {
          margin-bottom: 25px;

          color: #29e3ff;

          font-size: 14px;
          letter-spacing: 7px;
        }

        .hero h1 {
          margin: 0;

          color: #f7faff;

          font-size:
            clamp(
              48px,
              6.3vw,
              90px
            );

          line-height: .98;

          letter-spacing: -3px;

          font-weight: 800;
        }

        .hero h1 span {
          background:
            linear-gradient(
              90deg,
              #19ddff,
              #3e9fff 48%,
              #a970ff
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .hero p {
          max-width: 760px;

          margin:
            30px auto 28px;

          color: #9eacc0;

          font-size: 19px;

          line-height: 1.58;
        }

        .enter {
          width: 390px;
          max-width: 100%;

          height: 72px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 45px;

          margin: auto;

          border:
            1px solid
            rgba(36,224,255,.9);

          border-radius: 50px;

          background:
            linear-gradient(
              120deg,
              rgba(10,45,67,.68),
              rgba(3,18,34,.82)
            );

          color: white;

          font-size: 17px;

          letter-spacing: 5px;

          box-shadow:
            0 0 35px
            rgba(34,211,238,.12);

          cursor: pointer;

          transition:
            transform .3s ease,
            box-shadow .3s ease;
        }

        .enter:hover {
          transform:
            translateY(-3px);

          box-shadow:
            0 0 50px
            rgba(34,211,238,.24);
        }

        .enter b {
          color: #54eaff;

          font-size: 25px;

          font-weight: 400;
        }

        /* =================================================
           INTELLIGENCE
        ================================================= */

        .intelligence {
          position: relative;
          z-index: 10;

          width:
            min(
              1240px,
              calc(100% - 30px)
            );

          margin:
            38px auto 0;
        }

        .core-title {
          position: relative;
          z-index: 20;

          text-align: center;
        }

        .core-title span {
          display: block;

          margin-bottom: 8px;

          color: #718198;

          font-size: 13px;

          letter-spacing: 6px;
        }

        .core-title strong {
          display: block;

          color: #e7eff9;

          font-size: 22px;

          letter-spacing: 4px;
        }

        .live {
          position: absolute;
          z-index: 30;

          top: 38px;
          right: 3%;

          display: flex;
          align-items: center;

          gap: 10px;

          padding:
            10px 18px;

          border:
            1px solid
            rgba(78,115,157,.48);

          border-radius: 30px;

          background:
            rgba(6,20,37,.78);

          backdrop-filter:
            blur(18px);

          color: #7e8da2;

          font-size: 10px;

          letter-spacing: 2px;
        }

        .live i {
          width: 9px;
          height: 9px;

          border-radius: 50%;

          background: #50e8a8;

          box-shadow:
            0 0 14px #50e8a8;
        }

        .core-stage {
          position: relative;

          height: 620px;

          margin-top: 4px;

          overflow: visible;
        }

        .core-stage canvas {
          position: absolute !important;

          inset: 0;

          width: 100% !important;
          height: 100% !important;

          touch-action:
            pan-y !important;

          pointer-events:
            none !important;
        }

        /* =================================================
           MODULES
        ================================================= */

        .module {
          position: absolute;
          z-index: 20;

          display: flex;
          align-items: center;

          gap: 12px;

          pointer-events: auto;
        }

        .module-left {
          left: 1%;
        }

        .module-right {
          right: 1%;
        }

        .module-top {
          top: 25%;
        }

        .module-bottom {
          top: 69%;
        }

        .module-icon {
          width: 58px;
          height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(15,58,87,.88),
              rgba(3,15,28,.9)
            );

          backdrop-filter:
            blur(12px);

          font-size: 17px;
        }

        .module-icon.cyan {
          color: #48e8ff;

          border:
            1px solid
            rgba(34,211,238,.86);

          box-shadow:
            0 0 24px
            rgba(34,211,238,.25),

            inset 0 0 20px
            rgba(34,211,238,.10);
        }

        .module-icon.violet {
          color: #b497ff;

          border:
            1px solid
            rgba(167,139,250,.86);

          box-shadow:
            0 0 24px
            rgba(167,139,250,.25),

            inset 0 0 20px
            rgba(167,139,250,.10);
        }

        .module span {
          color: #9cabc0;

          font-size: 12px;

          letter-spacing: 2px;

          white-space: nowrap;
        }

        .module-left::after,
        .module-right::after {
          content: "";

          position: absolute;

          top: 50%;

          height: 1px;

          width: 110px;

          opacity: .78;
        }

        .module-left::after {
          left: 58px;

          background:
            linear-gradient(
              90deg,
              rgba(37,225,255,.9),
              transparent
            );
        }

        .module-right::after {
          right: 58px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(168,128,255,.9)
            );
        }

        /* =================================================
           CARDS SHELL
        ================================================= */

        .cards-shell {
          position: relative;
          z-index: 30;

          width:
            min(
              1180px,
              calc(100% - 70px)
            );

          margin:
            -8px auto 0;

          padding: 18px;

          border:
            1px solid
            rgba(79,126,174,.50);

          border-radius: 28px;

          background:
            linear-gradient(
              145deg,
              rgba(8,26,47,.91),
              rgba(2,12,26,.96)
            );

          backdrop-filter:
            blur(22px);

          box-shadow:
            0 30px 90px
            rgba(0,0,0,.44),

            inset 0 1px 0
            rgba(255,255,255,.05);
        }

        .cards {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 15px;
        }

        /* =================================================
           FEATURE CARD
        ================================================= */

        .feature-card {
          position: relative;

          min-width: 0;

          height: 215px;

          padding: 23px;

          text-align: left;

          border:
            1px solid
            rgba(78,120,163,.62);

          border-radius: 21px;

          background:
            linear-gradient(
              145deg,
              rgba(12,40,68,.97),
              rgba(4,17,34,.99)
            );

          color: white;

          overflow: hidden;

          cursor: pointer;

          transition:
            transform .28s ease,
            border-color .28s ease,
            box-shadow .28s ease;
        }

        .feature-card.violet {
          background:
            linear-gradient(
              145deg,
              rgba(54,42,103,.97),
              rgba(16,17,43,.99)
            );
        }

        .feature-card.blue {
          background:
            linear-gradient(
              145deg,
              rgba(19,49,94,.97),
              rgba(6,19,43,.99)
            );
        }

        .feature-card::after {
          content: "";

          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 3px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #20e3ff,
              transparent
            );

          box-shadow:
            0 0 18px
            rgba(32,227,255,.75);
        }

        .feature-card.violet::after {
          background:
            linear-gradient(
              90deg,
              transparent,
              #a36cff,
              transparent
            );

          box-shadow:
            0 0 18px
            rgba(163,108,255,.75);
        }

        .feature-card.blue::after {
          background:
            linear-gradient(
              90deg,
              transparent,
              #3c8fff,
              transparent
            );

          box-shadow:
            0 0 18px
            rgba(60,143,255,.75);
        }

        .feature-card:hover {
          transform:
            translateY(-5px);

          border-color:
            rgba(34,211,238,.9);

          box-shadow:
            0 18px 45px
            rgba(0,0,0,.40),

            0 0 34px
            rgba(34,211,238,.15);
        }

        .feature-card.violet:hover {
          border-color:
            rgba(167,139,250,.92);

          box-shadow:
            0 18px 45px
            rgba(0,0,0,.40),

            0 0 34px
            rgba(167,139,250,.16);
        }

        .feature-icon {
          width: 54px;
          height: 54px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 23px;

          border-radius: 15px;

          border:
            1px solid
            rgba(34,211,238,.68);

          background:
            linear-gradient(
              145deg,
              rgba(19,72,101,.80),
              rgba(5,28,48,.92)
            );

          color: #45e9ff;

          font-size: 23px;

          box-shadow:
            inset 0 0 20px
            rgba(34,211,238,.09);
        }

        .feature-card.violet
        .feature-icon {
          color: #b99cff;

          border-color:
            rgba(167,139,250,.72);

          background:
            linear-gradient(
              145deg,
              rgba(60,45,112,.80),
              rgba(20,20,50,.92)
            );
        }

        .feature-card.blue
        .feature-icon {
          color: #68a8ff;

          border-color:
            rgba(59,130,246,.74);

          background:
            linear-gradient(
              145deg,
              rgba(22,58,112,.82),
              rgba(7,25,53,.92)
            );
        }

        .feature-card h3 {
          margin:
            0 0 9px;

          color: #f2f6fc;

          font-size: 17px;

          font-weight: 700;

          letter-spacing: 1.2px;
        }

        .feature-card p {
          max-width: 220px;

          margin: 0;

          color: #9cafc5;

          font-size: 13px;

          line-height: 1.55;
        }

        .feature-arrow {
          position: absolute;

          right: 16px;
          bottom: 15px;

          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(98,126,160,.68);

          border-radius: 50%;

          color: #c7d3e3;

          font-size: 15px;
        }

        /* =================================================
           STATUS
        ================================================= */

        .status {
          position: relative;
          z-index: 20;

          width:
            min(
              1180px,
              calc(100% - 70px)
            );

          margin:
            28px auto 55px;

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);
        }

        .status-item {
          min-height: 82px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 15px;

          border-right:
            1px solid
            rgba(93,116,146,.2);
        }

        .status-item:last-child {
          border-right: none;
        }

        .status-symbol {
          color: #b9c7da;

          font-size: 22px;
        }

        .status-symbol.green {
          color: #4ee7a5;

          text-shadow:
            0 0 16px
            rgba(78,231,165,.7);
        }

        .status-item small {
          display: block;

          margin-bottom: 7px;

          color: #66768d;

          font-size: 9px;

          letter-spacing: 3px;
        }

        .status-item strong {
          display: block;

          color: #d7e0ec;

          font-size: 13px;

          letter-spacing: 1px;
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 700px) {

          .header {
            width:
              calc(100% - 42px);

            padding-top: 25px;
          }

          .brand {
            font-size: 26px;
            letter-spacing: 6px;
          }

          .online {
            gap: 7px;

            font-size: 8px;

            letter-spacing: 1.5px;
          }

          .online span {
            width: 8px;
            height: 8px;
          }

          /* HERO */

          .hero {
            margin-top: 58px;

            padding:
              0 21px;
          }

          .eyebrow {
            margin-bottom: 25px;

            font-size: 9px;

            letter-spacing: 4px;
          }

          .hero h1 {
            font-size:
              clamp(
                40px,
                10.8vw,
                54px
              );

            line-height: 1.01;

            letter-spacing: -2px;
          }

          .hero p {
            margin:
              26px auto 27px;

            font-size: 15.5px;

            line-height: 1.6;
          }

          .enter {
            width: 365px;

            height: 64px;

            gap: 30px;

            font-size: 13px;

            letter-spacing: 4px;
          }

          /* CORE */

          .intelligence {
            width: 100%;

            margin-top: 55px;
          }

          .core-title span {
            font-size: 9px;

            letter-spacing: 5px;
          }

          .core-title strong {
            font-size: 18px;

            letter-spacing: 2.7px;
          }

          .live {
            top: 67px;

            right: 50%;

            transform:
              translateX(50%);

            padding:
              9px 15px;

            font-size: 8.5px;

            letter-spacing: 1.5px;
          }

          .core-stage {
            height: 545px;

            margin-top: 12px;

            overflow: visible;

            touch-action:
              pan-y;
          }

          .module-left {
            left: 18px;
          }

          .module-right {
            right: 18px;
          }

          .module-top {
            top: 24%;
          }

          .module-bottom {
            top: 68%;
          }

          .module-icon {
            width: 45px;
            height: 45px;

            font-size: 12px;
          }

          .module span {
            font-size: 8px;

            letter-spacing: 1px;
          }

          .module-left::after,
          .module-right::after {
            width: 32px;
          }

          .module-left::after {
            left: 45px;
          }

          .module-right::after {
            right: 45px;
          }

          /* CARDS */

          .cards-shell {
            width:
              calc(100% - 22px);

            margin-top: 0;

            padding: 10px;

            border-radius: 22px;
          }

          .cards {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap: 10px;
          }

          .feature-card {
            height: 190px;

            padding: 15px;

            border-radius: 17px;
          }

          .feature-icon {
            width: 45px;
            height: 45px;

            margin-bottom: 16px;

            border-radius: 12px;

            font-size: 19px;
          }

          .feature-card h3 {
            margin-bottom: 7px;

            font-size: 12px;

            letter-spacing: .8px;
          }

          .feature-card p {
            max-width: 135px;

            font-size: 10.5px;

            line-height: 1.45;
          }

          .feature-arrow {
            width: 30px;
            height: 30px;

            right: 8px;
            bottom: 8px;

            font-size: 12px;
          }

          /* STATUS */

          .status {
            width:
              calc(100% - 35px);

            margin:
              24px auto 35px;

            display: flex;

            flex-direction: column;
          }

          .status-item {
            min-height: 72px;

            justify-content:
              flex-start;

            padding:
              10px 20px;

            border-right: none;

            border-bottom:
              1px solid
              rgba(93,116,146,.18);
          }

          .status-item:last-child {
            border-bottom: none;
          }

        }

      `}</style>

    </main>
  );
}