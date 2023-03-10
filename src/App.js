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
        image: imagesAvailable[index]?.url,
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
    setMoveableComponents(moveableComponents.filter(function (component) {
      return component.id !== selected
    }));
    setSelected(null)

  }

  const handleResizeStart = (index, e) => {
    // Check if the resize is coming from the left handle
    const [handlePosX] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      console.log("width", moveableComponents, e);
      // Save the initial left and width values of the moveable component
      // const initialLeft = e.left;
      // const initialWidth = e.width;

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
  image,
  id,
  setSelected,
  isSelected = false,
  removeMoveableComponent,
  updateEnd,
}) => {
  const ref = useRef();

  const objectFills = ["cover", "fill", "contain", "scale-down", "none"]

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    image,
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
      image,
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
      newWidth = parentBounds?.width ;


    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    let absoluteTop = top + beforeTranslate[1];
    let absoluteLeft = left + beforeTranslate[0] ;
    
    if(nodoReferencia.translateX < 0){
      absoluteLeft = absoluteLeft - nodoReferencia.translateX;
    }

    if(nodoReferencia.translateY < 0){
      absoluteTop= absoluteTop - nodoReferencia.translateY;
    }

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        image,
      },
      true
    );
  };


  const deleteCustom = {
    name: "tooltool",
    render(moveable) {
      const { renderPoses } = moveable.state;

      return (
        <img alt={`delete`} onClick={() => { removeMoveableComponent() }} src="https://cdn-icons-png.flaticon.com/512/3687/3687412.png" style={{
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
        <img key={index} src={image} style={{ objectFit: Math.floor(Math.random() * objectFills.length), width: "100%", height: "100%" }} alt={`background`}/>
      </div>
      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={(e) => {
          let bounX = parent.offsetWidth - ref.current.offsetWidth;
          let bounY = parent.offsetHeight - ref.current.offsetHeight;
          console.log(bounX)
          if ((e.left < bounX && e.left > 0 && e.top > 0 && e.top < bounY)) {
            updateMoveable(id, {
              top: e.top,
              left: e.left,
              width,
              height,
              image,
            });
          }
        }
        }
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
        onDragEnd={()=>{console.log(width)}}
        ables={[deleteCustom]}
        tooltool={true}
      />
    </>
  );
};
