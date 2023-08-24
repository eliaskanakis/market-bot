import { useState, useEffect } from "react"
import callService from "../utils/call-service"

export default function ShoppingList() {
  const [previewByCategory, setPreviewByCategory] = useState(false)
  const [shoppingList, setShoppingList] = useState([])
  const [newItem, setNewItem] = useState("")
  const [itemsByCategory, setItemsByCategory] = useState(null)

  useEffect(() => {
    setShoppingList(
      ["Αγγούρια","Αυγά","Αφρός ξυρίσματος","Γάλα","Καρότα","Καφέ","Κοτόπουλο",
      "Κουάκερ","Κρασιά","Μακαρόνια","Μέλι","Μήλα","Μουστάρδα","Μπανάνες","Μπατονέτες",
      "Μπύρες","Ντομάτες","Οδοντόκρεμα","Πατάτες","Ρύζι","Σαμπουάν","Ταχίνι",
      "Τόνος","Τορτελίνια","Τυρί τοστ","Φέτα","Φουντούκια","Φυστίκια","Φυστικοβούτυρο",
      "Ψωμί τοστ"]
    )
  }, [])

  async function categorize() {
    try{
      const res=await callService("categorize",shoppingList);
      setItemsByCategory(res.itemsByCategory);
    } catch (error) {
      alert("Error:" + error.message);
    }
    return [{
      "category": "Λαχανικά",
      "items": ["Λάχανο", "Καρότο", "Μαρούλι", "Κουνουπίδι"]
    }, {
      "category": "Πρωινό",
      "items": ["Καφές", "Γάλα"]
    }, {
      "category": "Zafeiris",
      "items": ["Καφές", "Γάλα"]
    }]
  }

  function createFlatList() {
    return <div class="shoppingList" id="shoppingList">
      <h2 class="list">Shopping List : </h2>
      {shoppingList.map((item, i) => {
        return <h4 class="item" key={'item' + i}>{item}</h4>
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
    if (!itemsByCategory) return null;
    return <div class="accordion" id="accordionExample">
      {itemsByCategory.map((cat, i) =>
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

  async function onByCatClick(e) {
    if (!previewByCategory) await categorize();
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
        />
        <button id="button1"
          type="button" class="btn btn-success"
          onClick={() => { 
            if (!newItem) return;
            setShoppingList(current => [...current, newItem]);
            setPreviewByCategory(false);
          }}
        >Add</button>
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