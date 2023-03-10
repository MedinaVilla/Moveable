import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);

  const [imagesAvailable, setImagesAvailable] = useState([]);

  useEffect(() => {
    // Obtenemos todas las posibles imagenes que se van a renderizar una UNICA VEZ para no estar llamando acada rato la API al agregar un componente
    const getImageRandom = async () => {
      fetch('https://jsonplaceholder.typicode.com/photos').then(function (response) {
        return response.json();
      }).then(function (data) {
        setImagesAvailable(data);
      });
    }
    getImageRandom();
  }, [])

  //   const removeImageAvailableByIndex = (indexFrom)=> {
  //     setImagesAvailable(imagesAvailable.filter(function(image, index) { 

  //       console.log(index)
  //       return index !== indexFrom
  //   }));
  // }

  const removeImageAvailableByIndex = (index) => {
    setImagesAvailable([
      ...imagesAvailable.slice(0, index),
      ...imagesAvailable.slice(index + 1)
    ]);
  }

  const addMoveable = async () => {
    // Create a new moveable component and add it to the array
    let index = Math.floor(Math.random() * imagesAvailable.length);
    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        color: imagesAvailable[index]?.url,
        updateEnd: true
      },
    ]);

    removeImageAvailableByIndex(index);
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const removeMoveableComponent = () => {
    setSelected(null)
    setMoveableComponents(moveableComponents.filter(function (component) {
      return component.id !== selected
    }));
  }

  const handleResizeStart = (index, e) => {
    console.log("e", e.direction);
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      console.log("width", moveableComponents, e);
      // Save the initial left and width values of the moveable component
      const initialLeft = e.left;
      const initialWidth = e.width;

      // Set up the onResize event handler to update the left value based on the change in width
    }
  };

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable1</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <React.Fragment key={'component-' + index}>
            <Component
              {...item}
              key={index}
              updateMoveable={updateMoveable}
              handleResizeStart={handleResizeStart}
              removeMoveableComponent={removeMoveableComponent}
              setSelected={setSelected}
              isSelected={selected === item.id}
            />
          </React.Fragment>
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  removeMoveableComponent,
  updateEnd,
}) => {
  const ref = useRef();

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  const onResize = async (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    let newWidth = e.width;
    let newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };

  const customAble = {
    name: "tooltool",
    render(moveable) {
      const { renderPoses } = moveable.state;

      return (
        <img onClick={() => { removeMoveableComponent() }} src="https://cdn-icons-png.flaticon.com/512/3687/3687412.png" style={{
          width: 20, height: 20,
          cursor: "pointer",
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${renderPoses[1][0]}px, ${renderPoses[1][1]
            }px) translateZ(-50px)`,
          zIndex: 100
        }}>
        </img>

      );
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
        }}
        onClick={() => setSelected(id)}
      >
        <img src={color} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
      </div>
      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={(e) => {
          var boun = parent.offsetWidth - ref.current.offsetWidth;
          var bounY = parent.offsetHeight - ref.current.offsetHeight;

          var posX = e.clientX;
          var posY = e.clientY;

          var diffX = posX - left;
          var diffY = posY - top;

          var aX = posX - diffX;
          var aY = posY - diffY

          console.log("aX: " + aX + " aY: " + aY)
          console.log("boundX: " + boun + " boundY: " + bounY)
          if ((aX < boun && aY >= 0 && aX >= 0 && aY < bounY)) {
            updateMoveable(id, {
              top: e.top,
              left: e.left,
              width,
              height,
              color,
            });
          }
        }}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}

        ables={[customAble]}
        tooltool={true}
      />
    </>
  );
};
