import React, { useState } from "react";
import {
  CommunityPosting,
  PostImgBox,
  PostImgUrl,
  PostContent,
  PostBottomBar,
  Button,
  ButtonSet,
  LikeCount,
} from "../components/TabPostStyled";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { db, auth } from "../firebase";
import { useQuery } from "react-query";
import PostingModal from "./CommentsModal";
import Heart from "./Heart";

function BarPost() {
  const userId = auth.currentUser.uid;
  //모달
  const [openModal, setOpenModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  //모달 열기
  const handlePostClick = (post) => {
    // 배경 페이지 스크롤 막기
    document.body.style.overflow = "hidden";
    setSelectedPost(post);
    setSelectedPostId(post.postId);
    setOpenModal(true);
  };

  //공개 게시물 가져오기
  const getPublicPosts = async () => {
    const postsCollectionRef = collection(db, "posts");

    const querySnapshot = await getDocs(
      query(postsCollectionRef, where("isPublic", "==", true))
    );

    const PublicPosts = querySnapshot.docs.map((postDoc) => {
      const data = postDoc.data();

      return {
        postId: postDoc.id,
        imageUrl: data.photo,
        content: data.content,
        category: data.place.category_name,
        likeCount: data.likeCount,
      };
    });
    return PublicPosts;
  };

  const { data: PublicPosts } = useQuery("fetchPublicPosts", getPublicPosts);
  const filterdPosts = PublicPosts?.filter(
    (post) =>
      post.category === "음식점 > 술집" ||
      post.category === "음식점 > 술집 > 호프,요리주점"
  );

  //유저 좋아요, 댓글 정보 가져오기
  const getUserData = async () => {
    const userDocRef = doc(db, "users", userId);

    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      return {
        userLikes: userData.userLikes || [],
      };
    } else {
      return {
        userLikes: [],
      };
    }
  };
  const { data: userData } = useQuery("fetchUserData", getUserData);

  return (
    <>
      {filterdPosts?.map((item) => (
        <CommunityPosting key={item.postId}>
          <div>
            {item.imageUrl ? (
              <>
                <PostImgBox>
                  <PostImgUrl src={item.imageUrl}></PostImgUrl>
                </PostImgBox>
              </>
            ) : (
              <>
                <PostImgBox>
                  {/* <PostImgUrl src={}> </PostImgUrl> */}
                  무슨 사진 넣을지 고민중
                </PostImgBox>
              </>
            )}
            <PostContent>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
            </PostContent>
            <PostBottomBar>
              <ButtonSet>
                <Heart userData={userData} item={item} />
                <LikeCount>{item.likeCount}</LikeCount>
                <Button
                  onClick={() => {
                    handlePostClick(item);
                  }}
                >
                  <FontAwesomeIcon icon={faComment} size="lg" />
                </Button>
                <Button>
                  <FontAwesomeIcon icon={faArrowUpFromBracket} size="lg" />
                </Button>
              </ButtonSet>
            </PostBottomBar>
          </div>
        </CommunityPosting>
      ))}
      <PostingModal
        userData={userData}
        Button={Button}
        selectedPost={selectedPost}
        openModal={openModal}
        setOpenModal={setOpenModal}
        setSelectedPostId={setSelectedPost}
      />
    </>
  );
}
export default BarPost;