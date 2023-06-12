import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import axios from "axios";
import jwt from "jsonwebtoken";
import { useEffect } from "react";


function CommentModal({ reservation, isOpen, setOpen, setAllData }) {
    const [user, setUser] = useState({});
    useEffect(() => {
        if (isOpen) {
            const token = localStorage?.getItem("cosmo_token");
            if (token) {
                const userr = jwt.decode(token);
                setUser(userr);
            }
        }
    }, [isOpen]);

    const [comment, setComment] = useState("");
    const handleAddComment = async () => {
        const token = localStorage.getItem("cosmo_token");
        const userr = jwt.decode(token);
        const user = userr?.username;
        if (comment === "") return window.alert("Molimo unesite komentar")
        let newComment = {
            user: user,
            comment: comment,
            date: new Date()
        }
        let tmp = reservation
        if (!tmp.comments) tmp.comments = []
        tmp.comments.push(newComment)
        reservation['comments'] = tmp.comments

        let body = {
            method: 'update',
            table: 'reservations',
            objectId: reservation._id,
            updates: tmp
        }
        const res = await axios.post("/api/v1/commonservice", body);
        if (res.status === 200) {
            setComment("");
            console.log(res.data);
            setAllData((prev) => {
                return prev.map((r) => {
                    if (r._id === reservation._id) {
                        r.comments = res.data.comments
                    }
                    return r
                })
            })
        }

    };
    const handleDeleteComment = async (comment) => {
        let tmp = reservation
        tmp.comments = tmp.comments.filter((c) => c.comment.toLowerCase() !== comment.comment.toLowerCase())

        reservation['comments'] = tmp.comments

        let body = {
            method: 'update',
            table: 'reservations',
            objectId: reservation._id,
            updates: tmp
        }
        const res = await axios.post("/api/v1/commonservice", body);
        console.log(res.data)
        if (res.status === 200) {
            setComment(" ");
            setComment("");
            setAllData((prev) => {
                return prev.map((r) => {
                    if (r._id === reservation._id) {
                        r.comments = res.data.comments
                    }
                    return r
                })
            })
        }
    };

    const sortedComments = reservation?.comments?.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="dialogg" onClose={setOpen}>
                    <Transition.Child
                        as={Fragment}
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
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel as='div'>
                                    <div className='dialogPanel'>
                                        <Dialog.Title className="text-lg">Comments</Dialog.Title>
                                        <div>
                                            <input
                                                className="input-comment"
                                                type="text"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add a comment..."
                                            />
                                            <button onClick={handleAddComment} className="add-button">Add comment</button>
                                            <div className="comment-section">
                                                {sortedComments?.length > 0 ? (
                                                    sortedComments.map((comment, i) => (
                                                        <>
                                                            <br />
                                                            <div key={i} className="comment-bubble">
                                                                <p className="comment-header">
                                                                    {comment.user} commented on{" "}
                                                                    {new Date(comment.date).toLocaleDateString()}
                                                                    {" at "} {new Date(comment.date).toLocaleTimeString()}
                                                                </p>
                                                                <div className="comment-row">
                                                                    <p className="comment-text">{comment.comment}</p>
                                                                    {user?.isAdmin && (
                                                                        <button
                                                                            className="delete-button"
                                                                            onClick={() => handleDeleteComment(comment)}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    )}
                                                                </div>

                                                            </div>

                                                        </>
                                                    ))) : <p>No comments</p>}

                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            <style jsx>{`
        .comment-section {
          max-height: 300px;
          overflow-y: auto;
        }
        .comment-bubble {
          background-color: #008CBA;
          border-radius: 5px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          margin-bottom: 10px;
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
          max-width: 98.5vw;
        }
        .modal-div {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        .modal-div-outer {
          overflow-y: auto;
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
        .comment-row{
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
            align-items: center;

        }
        .add-button {
            background-color: white;
            border: 2px solid #008CBA;
            border-radius: 4px;
            border-color: #008CBA;
            color: black;
            padding: 8px 16px;
            text-align: center;
            display: inline-block;
            margin-bottom: 10px;
        }
        .add-button:hover {
            background-color: #008CBA;
            color: white;
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
        .delete-button {
            background-color: white;    
            border: none;
            border-radius: 6px;
            border-color: #f44336;
            color: black;
            padding: 8px 16px;
            text-align: center;
            display: inline-block;
        }
        .delete-button:hover {
            background-color: #f44336;
            color: white;
        }
        .input-comment {
            width: 100%; 
            padding: 12px 20px;
            margin: 8px 0;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
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
          max-width: 28rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .comment-header {
            font-size: 12px;
            margin-bottom: 5px;
            color: white;
        }
        .comment-text {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            max-width: 150px;
            overflow-wrap: break-word;
            color: white;
        }


      `}</style>
        </>
    );
}

export default CommentModal;
