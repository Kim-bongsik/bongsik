import { collection, doc, getDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const getMyTags = async () => {
  if (!auth.currentUser) {
    return [];
  }
  const tagRef = doc(db, "users", auth.currentUser?.uid);
  const tagSnap = await getDoc(tagRef);
  return tagSnap?.data().myTags;
};

const getPosts = async () => {
  if (!auth.currentUser) {
    return [];
  }
  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("uid", "==", auth.currentUser.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    docID: doc.id,
    postId: doc.id,
  }));
};
const deletePost = async (postID) => {
  const q = query(collection(db, "posts"), where("postID", "==", postID));
  try {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // console.log(doc.id, " => ", doc.data());
      deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error("Error deleting post: ", error);
  }
};
const getPublicPosts = async () => {
  const postsCollectionRef = collection(db, "posts");
  const querySnapshot = await getDocs(query(postsCollectionRef, where("isPublic", "==", true)));
  const PublicPosts = querySnapshot.docs.map((postDoc) => {
    const data = postDoc.data();
    return {
      ...data,
      postId: postDoc.id,
    };
  });
  return PublicPosts;
};

const getUserData = async () => {
  const userId = auth.currentUser?.uid;
  const userDocRef = doc(db, "users", userId);
  const docSnapshot = await getDoc(userDocRef);
  if (docSnapshot.exists()) {
    const userData = docSnapshot.data();
    return {
      userLikes: userData?.userLikes || [],
    };
  } else {
    return {
      userLikes: [],
    };
  }
};

export { getMyTags, getPosts, deletePost, getPublicPosts, getUserData };
