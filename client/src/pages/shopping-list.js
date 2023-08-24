import { useState, useEffect } from "react"
import callService from "../utils/call-service"

export default function ShoppingList() {
  const [previewByCategory, setPreviewByCategory] = useState(false)
  const [shoppingList, setShoppingList] = useState([])
  const [newItem, setNewItem] = useState("")
  const [itemsByCategory, setItemsByCategory] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const tmpShoppingList = localStorage.getItem("ShoppingList");
    if (!tmpShoppingList || tmpShoppingList==="[]") {
      setShoppingList(["Αγγούρια", "Αυγά", "Αφρός ξυρίσματος", "Γάλα", "Καρότα", "Καφέ", "Κοτόπουλο",
        "Κουάκερ", "Κρασιά", "Μακαρόνια", "Μέλι", "Μήλα", "Μουστάρδα", "Μπανάνες", "Μπατονέτες",
        "Μπύρες", "Ντομάτες", "Οδοντόκρεμα", "Πατάτες", "Ρύζι", "Σαμπουάν", "Ταχίνι",
        "Τόνος", "Τορτελίνια", "Τυρί τοστ", "Φέτα", "Φουντούκια", "Φυστίκια", "Φυστικοβούτυρο",
        "Ψωμί τοστ"]);
    } else {
      setShoppingList(JSON.parse(tmpShoppingList));
    }
  }, [])

  async function categorize() {
    try {
      setErrorMessage(null);
      setInfo("Waiting chat gpt to categorize the items ....");
      const res = await callService("categorize", shoppingList);
      setItemsByCategory(res.itemsByCategory);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setInfo(null);
    }
  }

  function onDelete(e, item) {
    e.preventDefault();
    let newShoppingList = [...shoppingList];
    var index = newShoppingList.indexOf(item);
    newShoppingList.splice(index, 1);
    setShoppingList(newShoppingList);
    localStorage.setItem("ShoppingList", JSON.stringify(newShoppingList));
  }

  function createFlatList() {
    if (!shoppingList) return null;
    return <div class="shoppingList" id="shoppingList">
      <h2 class="list">Shopping List : </h2>
      {shoppingList.map((item, i) => {
        return <div key={'item-' + i} class="d-flex flex-row">
          <h4 class="item">{item}</h4>
          <button class="btn-delete" onClick={(e) => onDelete(e, item)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
            </svg>
          </button>
        </div>
      })}
    </div>
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
    {info ? <div class="alert alert-info" role="alert">
      {info}
    </div> : null}
    {errorMessage ? <div class="alert alert-warning" role="alert">
      {errorMessage}
    </div> : null}
    <div class="container">
      <form id="form">
        <h1 for="item" class="add" id="add">Add a Shopping Item :</h1><br />
        <input type="text"
          id="lname" name="lname" placeholder="Shopping List"
          value={newItem}
          onChange={(e) => { setNewItem(e.target.value) }}
        /><br />
        <button id="button1"
          type="button" class="btn btn-success"
          onClick={() => {
            if (!newItem) return;
            let newShoppingList=[...shoppingList, newItem];
            localStorage.setItem("ShoppingList", JSON.stringify(newShoppingList));
            setShoppingList(newShoppingList);
            setPreviewByCategory(false);
          }}
        >Add</button><br />
        <button id="button2" type="button"
          class="btn btn-outline-success"
          onClick={onByCatClick}
        >{previewByCategory ? "All" : "By Category"}</button>
        <div id="outer-shoppingList">
          {createList()}
        </div>
        <div class="accordion" id="accordionExample">
        </div>
      </form>
    </div>
  </>
}