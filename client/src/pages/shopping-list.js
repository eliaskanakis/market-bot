import { useState, useEffect } from "react"

export default function ShoppingList() {
  const [previewByCategory, setPreviewByCategory] = useState(false)
  const [shoppingList, setShoppingList] = useState([])
  const [newItem, setNewItem] = useState("")

  useEffect(() => {
    setShoppingList(
      ["Λάχανο", "Καρότο", "Μαρούλι", "Χλωρίνη", "Detol", "Σαπούνι","Κουνουπίδι", "Καφές", "Γάλα"]
    )
  }, [])

  function getItemsByCategory() {
    return [{
      "category": "Λαχανικά",
      "items": ["Λάχανο", "Καρότο", "Μαρούλι", "Κουνουπίδι"]
    }, {
      "category": "Πρωινό",
      "items": ["Καφές", "Γάλα"]
    }, {
      "category": "Καθαριστικά",
      "items": ["Χλωρίνη", "Detol", "Σαπούνι"]
    }]
  }

  function onDelete(e, item) {
    e.preventDefault();
    let newShoppingList=[...shoppingList];
    var index = newShoppingList.indexOf(item);
    newShoppingList.splice(index,1);
    setShoppingList(newShoppingList);
    /*
    setShoppingList(oldShoppingList => {
      let newShoppingList=[...oldShoppingList];
    });*/
  }

  function createFlatList() {
    return <div class="shoppingList" id="shoppingList">
      <h2 class="list">Shopping List : </h2>
      {shoppingList.map((item, i) => {
        return <div class="d-flex flex-row"><h4 class="item" key={'item' + i}>{item}</h4>  
        <button class="btn-delete" onClick={(e)=>onDelete(e, item)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
          </svg>
        </button></div>
      })}
    </div>
    /*
    const array=getShoppingList();
    let retVal=[];
    for(let i=0;i<array.length;i++){
      retVal.push(<p key={'item'+i}>{array[i]}</p>);
    }
    return retVal;*/
  }

  function createListByCategory() {
    return <div class="accordion" id="accordionExample">
      {getItemsByCategory().map((cat, i) =>
        <div class="accordion-item" id="accordion-item" key={"e" + i}>
          <h2 class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${i}`} aria-expanded="true" aria-controls={`collapse${i}`} >
              <h2>{cat.category}</h2>
            </button>
          </h2>
          <div id={`collapse${i}`} class="accordion-collapse collapse" data-bs-parent="#accordionExample">
            <div class="accordion-body" id="accordion-body">
              {cat.items.map((item, j) => <h4 id="item" key={"e" + j}>
                <p class="item" id={`item${j}`}>{item}</p>
              </h4>)}
            </div>
          </div>
        </div>
      )}
    </div>

    /*
    return <ul key="categories">
      {getItemsByCategory().map((cat, i) => <li key={"e" + i}>
        {cat.category}
        <ul key="items">
          {cat.items.map((item, j) => <h4 id="item" key={"e" + j}>
            {item}
          </h4>)}
        </ul>
      </li>)}
    </ul>*/
  }

  function createList() {
    if (previewByCategory) {
      return createListByCategory();
    } else {
      return createFlatList();
    }
  }

  function onByCatClick(e) {
    setPreviewByCategory(!previewByCategory);
  }

  return <>
    <div class="container">
      <form id="form">
        <h1 for="item" class="add" id="add">Add a Shopping Item :</h1><br />
        <input type="text"
          id="lname" name="lname" placeholder="Shopping List"
          value={newItem}
          onChange={(e) => { setNewItem(e.target.value) }}
        /><br/>
        <button id="button1"
          type="button" class="btn btn-success"
          onClick={() => { 
            if (!newItem) return;
            setShoppingList(current => [...current, newItem]);
            setPreviewByCategory(false);
          }}
        >Add</button><br/>
        <button id="button2" type="button"
          class="btn btn-outline-success"
          onClick={onByCatClick}
        >{previewByCategory?"All":"By Category"}</button>
        <div id="outer-shoppingList">
          {createList()}
        </div>
        <div class="accordion" id="accordionExample">
        </div>
      </form>
    </div>
  </>
}