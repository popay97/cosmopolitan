import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import axios from "axios";
import jwt from "jsonwebtoken";

function ExtraRatesModal({ booking, extraRates, isOpen, setOpen, onFinish }) {
  const [selectedItemsW1, setSelectedItemsW1] = useState([]);
  const [selectedItemsW2, setSelectedItemsW2] = useState([]);
  const [customItem, setCustomItem] = useState({
    name: "",
    specs: "",
    price: 0,
  });

  useEffect(() => {
    if (booking) {
      setSelectedItemsW1(booking.extraItemsw1 || []);
      setSelectedItemsW2(booking.extraItemsw2 || []);
    }
  }, [booking]);

  const handleAddItemW1 = (item) => {
    setSelectedItemsW1([...selectedItemsW1, item]);
  };

  const handleAddItemW2 = (item) => {
    setSelectedItemsW2([...selectedItemsW2, item]);
  };

  const handleRemoveItemW1 = (index) => {
    setSelectedItemsW1(selectedItemsW1.filter((_, i) => i !== index));
  };

  const handleRemoveItemW2 = (index) => {
    setSelectedItemsW2(selectedItemsW2.filter((_, i) => i !== index));
  };

  const handleCustomItemChange = (e) => {
    const { name, value } = e.target;
    setCustomItem({ ...customItem, [name]: value });
  };

  const handleAddCustomItemW1 = () => {
    handleAddItemW1(customItem);
    setCustomItem({ name: "", specs: "", price: 0 });
  };

  const handleAddCustomItemW2 = () => {
    handleAddItemW2(customItem);
    setCustomItem({ name: "", specs: "", price: 0 });
  };

  const handleFinish = () => {
    onFinish({
      resId: booking.resId,
      extraItemsw1: selectedItemsW1,
      extraItemsw2: selectedItemsW2,
    });
    setOpen(false);
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="dialogg" onClose={() => setOpen(false)}>
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="child1" />
          </Transition.Child>
          <div className="modal-div-outer">
            <div className="modal-div-inner">
              <Transition.Child
                as="div"
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel as="div">
                  <div className="dialogPanel">
                    <Dialog.Title className="text-lg">Extra Rates</Dialog.Title>
                    <div className="extra-rates-section">
                      <div className="extra-rates-way">
                        <h2>Way 1</h2>
                        <div className="selected-items">
                          {selectedItemsW1?.map((item, index) => (
                            <div key={index} className="item-bubble">
                              <span>
                                {item.item} {item.specs} {item.price.incoming}
                              </span>
                              <button
                                className="delete-button"
                                onClick={() => handleRemoveItemW1(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="available-items">
                          <h3>Available Items</h3>
                          {extraRates.map((item, index) => (
                            <div key={index} className="item-bubble">
                              <span>
                                {item.item} ({item.specs}):{" "}
                                {item.price.incoming}
                              </span>
                              <button
                                className="add-button"
                                onClick={() => handleAddItemW1(item)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="custom-item-form">
                          <h3>Add Custom Item</h3>
                          <input
                            type="text"
                            name="name"
                            value={customItem.name}
                            onChange={handleCustomItemChange}
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            name="specs"
                            value={customItem.specs}
                            onChange={handleCustomItemChange}
                            placeholder="Specs"
                          />
                          <input
                            type="number"
                            name="price"
                            value={customItem.price.incoming}
                            onChange={handleCustomItemChange}
                            placeholder="Price"
                          />
                          <button
                            className="add-button"
                            onClick={handleAddCustomItemW1}
                          >
                            Add Custom Item
                          </button>
                        </div>
                      </div>
                      <div className="extra-rates-way">
                        <h2>Way 2</h2>
                        <div className="selected-items">
                          {selectedItemsW2?.map((item, index) => (
                            <div key={index} className="item-bubble">
                              <span>
                                {item.item} {item.specs} {item.price.incoming}
                              </span>
                              <button
                                className="delete-button"
                                onClick={() => handleRemoveItemW2(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="available-items">
                          <h3>Available Items</h3>
                          {extraRates?.map((item, index) => (
                            <div key={index} className="item-bubble">
                              <span>
                                {item.item} ({item.specs}):{" "}
                                {item.price.incoming}
                              </span>
                              <button
                                className="add-button"
                                onClick={() => handleAddItemW2(item)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="custom-item-form">
                          <h3>Add Custom Item</h3>
                          <input
                            type="text"
                            name="name"
                            value={customItem.name}
                            onChange={handleCustomItemChange}
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            name="specs"
                            value={customItem.specs}
                            onChange={handleCustomItemChange}
                            placeholder="Specs"
                          />
                          <input
                            type="number"
                            name="price"
                            value={customItem.price.incoming}
                            onChange={handleCustomItemChange}
                            placeholder="Price"
                          />
                          <button
                            className="add-button"
                            onClick={handleAddCustomItemW2}
                          >
                            Add Custom Item
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFinish} className="finish-button">
                      Finish
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <style jsx>{`
        .extra-rates-section {
          display: flex;
          justify-content: space-between;
        }
        .extra-rates-way {
          width: 45%;
        }
        .selected-items,
        .available-items {
          margin-bottom: 20px;
        }
        .item-bubble {
          background-color: #008cba;
          border-radius: 5px;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .delete-button,
        .add-button,
        .finish-button {
          background-color: white;
          border: 2px solid #008cba;
          border-radius: 4px;
          color: black;
          padding: 8px 16px;
          text-align: center;
          margin-left: 10px;
        }
        .delete-button:hover,
        .add-button:hover,
        .finish-button:hover {
          background-color: #008cba;
          color: white;
        }
        .custom-item-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dialogg {
          position: relative;
          z-index: 10;
        }
        .child1 {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-color: rgba(0, 0, 0, 0.25);
        }
        .modal-div-outer {
          overflow-y: auto;
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .modal-div-inner {
          display: flex;
          padding: 1rem;
          text-align: center;
          justify-content: center;
          align-items: center;
          min-height: 100%;
          min-width: 300px;
        }
        .dialogPanel {
          overflow: hidden;
          padding: 1.5rem;
          background-color: rgba(255, 255, 255, 1);
          transition-property: all;
          text-align: left;
          vertical-align: middle;
          width: 100%;
          min-height: 200px;
          max-width: 40rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
}

export default ExtraRatesModal;
