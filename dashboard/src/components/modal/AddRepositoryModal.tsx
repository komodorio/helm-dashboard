import React from "react";
import Modal from "./Modal";

type AddRepositoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AddRepositoryModal({ isOpen, onClose }: AddRepositoryModalProps) {

  const addRepository = ()=>{
    onClose();
    console.log("add");
  }

  return (
    <Modal
      containerClassNames={
        "border-2 border-error-border-color bg-error-background"
      }
      title="Add Chart Repository"
      isOpen={isOpen}
      onClose={onClose}
      bottomContent={ <div className="flex justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600"> 
        <button className="text-white bg-[#1347FF] hover:bg-[#0b5ed7] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={addRepository}>Add Repository</button>
      </div>}
    >
      <div className="w-[400px] flex flex-row">
        <span className="w-1/2">Name:</span>
        <span className="w-1/2">URL:</span>
      </div>
      <div className="w-[400px] flex flex-row gap-1">
        <input type="text" className="rounded-lg p-2 w-1/2 border border-gray-300"/>
        <input type="text" className="rounded-lg p-2 w-1/2 border border-gray-300"/>
      </div>
    </Modal>
  );
}

export default AddRepositoryModal;
