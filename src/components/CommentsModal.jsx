import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { db, auth } from "../firebase";
import { collection, addDoc, where, query, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import useAuthStore from "../store/auth";
import styled from "styled-components";
import {
  ModalWrapper,
  ModalContent,
  SubmitButton,
  InputBox,
  Form,
  CommentWrap,
  CommentButton,
  CloseButton,
  CommentInput,
  ContentArea,
  UserInfo,
  UserProfile,
  UserNameAndLevel,
  Nickname,
  ProfileCircle,
  ModalLocation,
  InputArea,
} from "./TabPostStyled";
import { nanoid } from "nanoid";
import { faStar, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
function PostingModal({ openModal, setOpenModal, selectedPost, setSelectedPostId }) {
  const authStore = useAuthStore();
  const displayName = authStore.user?.displayName;
  const isLogIn = authStore.user !== null;
  const userId = auth.currentUser?.uid;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  // 댓글 수정
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  // 댓글 세기
  const [, setCommentCount] = useState(0);
  //모달 닫기
  const handleCloseModal = () => {
    // 배경 페이지 스크롤 활성화
    document.body.style.overflow = "auto";
    setOpenModal(false);
    setSelectedPostId(null);
  };

  // //게시물 댓글 가져오기
  const getPostComments = async (postId) => {
    const commentsCollectionRef = collection(db, "postComments");

    const querySnapshot = await getDocs(query(commentsCollectionRef, where("postId", "==", postId)));
    const PostComments = querySnapshot.docs.map((commentsDoc) => {
      const data = commentsDoc.data();
      return {
        ...data,
      };
    });
    return PostComments;
  };

  const { data: PostComments } = useQuery("fetchPostComments", () => getPostComments(selectedPost.postId), {
    enabled: !!selectedPost?.postId,
    onSuccess: () => {
      setCommentCount(0); // 초기 댓글 개수 0으로 설정
    },
  });
  console.log("postComments", PostComments);

  // 댓글 추가
  const addCommentMutation = useMutation(
    async (newComment) => {
      const commentsCollectionRef = collection(db, "postComments");
      await addDoc(commentsCollectionRef, newComment);
    },
    {
      onSuccess: async () => {
        const postDocRef = doc(db, "posts", selectedPost.postId);
        const postSnapshot = await getDoc(postDocRef);
        const currentCommentCount = postSnapshot.data().commentCount;

        // 게시물의 commentCount 업데이트
        await updateDoc(postDocRef, {
          commentCount: currentCommentCount + 1,
        });
        queryClient.invalidateQueries("fetchPostComments");
        // fetchPublicPosts 쿼리 다시 호출하여 게시물 리스트 업데이트
        queryClient.invalidateQueries("fetchPublicPosts");
      },
    }
  );

  //  댓글 작성 버튼 핸들러
  const handleSubmit = async (e, postId) => {
    e.preventDefault();
    console.log(postId);
    const commentInput = e.target.comment;
    const comment = commentInput.value;

    if (!isLogIn) {
      alert("로그인 후 이용해주세요!");
      navigate("/signin");
      return;
    }
    if (comment === "") {
      alert("댓글을 입력해주세요");
      return;
    }

    const newComment = {
      nickName: displayName,
      postId: postId,
      userId: userId,
      comment: comment,
      date: new Date().toISOString(),
      commentId: nanoid(),
      commentPhoto: user.photoUrl,
    };

    await addCommentMutation.mutateAsync(newComment);

    commentInput.value = "";
  };
  // 댓글 삭제
  const deleteCommentMutation = useMutation(async (commentId) => {
    const commentsCollectionRef = collection(db, "postComments");
    const querySnapshot = await getDocs(query(commentsCollectionRef, where("commentId", "==", commentId)));
    if (!querySnapshot.empty) {
      const commentDocRef = doc(db, "postComments", querySnapshot.docs[0].id);
      await deleteDoc(commentDocRef);
    }

    // 해당 게시물의 commentCount 업데이트
    const postDocRef = doc(db, "posts", selectedPost.postId);
    const postSnapshot = await getDoc(postDocRef);
    const currentCommentCount = postSnapshot.data().commentCount;
    await updateDoc(postDocRef, {
      commentCount: currentCommentCount - 1,
    });
    queryClient.invalidateQueries("fetchPostComments");
    queryClient.invalidateQueries("fetchPublicPosts");
  });
  // 댓글 수정
  const handleEdit = (commentId, currentComment) => {
    setEditingCommentId(commentId);
    setEditedComment(currentComment);
  };

  const handleSaveEdit = async (commentId, postId) => {
    const commentsCollectionRef = collection(db, "postComments");

    const querySnapshot = await getDocs(query(commentsCollectionRef, where("commentId", "==", commentId)));

    if (!querySnapshot.empty) {
      const commentDocRef = querySnapshot.docs[0].ref;

      const updatedComment = {
        nickName: displayName,
        postId: postId,
        userId: userId,
        comment: editedComment,
        commentId: commentId,
        date: new Date().toISOString(),
        commentPhoto: user.photoUrl,
        edited: "수정됨",
      };

      await updateDoc(commentDocRef, updatedComment);

      queryClient.invalidateQueries("fetchPostComments");

      // 수정 완료 후 상태 초기화
      setEditingCommentId(null);
      setEditedComment("");
    }
  };
  // 댓글 시간
  const elapsedTime = (date) => {
    const start = new Date(date);
    const end = new Date();
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return "방금 전";
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}분 전`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}시간 전`;
    const days = hours / 24;
    if (days < 7) return `${Math.floor(days)}일 전`;
    return `${start.toLocaleDateString()}`;
  };

  return (
    <>
      {openModal && selectedPost && (
        <ModalWrapper onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>X</CloseButton>
            <UserInfo>
              <UserProfile>
                <ProfileBox photo={selectedPost.userPhoto} />
                <UserNameAndLevel>
                  <Nickname>
                    {selectedPost.userName}&nbsp;Lv.
                    <br />
                    <DateDiv>{selectedPost.timestamp?.toDate().toLocaleDateString()}</DateDiv>
                  </Nickname>
                </UserNameAndLevel>
              </UserProfile>
            </UserInfo>
            <ModalLocation>
              <p>
                <Place>
                  {selectedPost.place.place_name}&nbsp;
                  {Array(selectedPost.star)
                    .fill()
                    .map((_, index) => (
                      <FontAwesomeIcon key={index} icon={faStar} style={{ color: "#ff4e50" }} size="sm" />
                    ))}
                </Place>
                <br />
                <DetailLocation>
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/kimbongsik-69c45.appspot.com/o/location.png?alt=media&token=4850f645-0cac-41c4-91f5-595f28d33b79"
                    style={{
                      width: "0.9rem",
                      height: "1rem",
                      marginTop: "0.3rem",
                      marginRight: "0.3rem",
                      float: "left",
                    }}
                  />

                  {selectedPost.place.address_name}
                  <br />
                </DetailLocation>
              </p>
            </ModalLocation>
            {selectedPost && <img src={selectedPost.photo} alt="Post" />}
            <h2>{selectedPost.title}</h2>
            <ContentArea>
              {selectedPost.content} <hr />
            </ContentArea>
            <InputArea>
              <ProfileCircle style={{ marginLeft: "2rem" }}>
                <ProfileBox photo={user.photoUrl} />
              </ProfileCircle>
              <Form onSubmit={(e) => handleSubmit(e, selectedPost.postId)}>
                <InputBox name="comment" placeholder="댓글을 작성해주세요"></InputBox>
                <SubmitButton type="submit">작성</SubmitButton>
              </Form>
            </InputArea>
            {PostComments?.map(
              (comment) =>
                comment.postId === selectedPost.postId && (
                  <CommentWrap key={comment.commentId}>
                    <div style={{ marginLeft: "2rem", display: "flex" }}>
                      <ProfileBox photo={comment.commentPhoto}></ProfileBox>
                      <div style={{ display: "column" }}>
                        <Nickname style={{ marginTop: "1rem", display: "flex" }}>
                          {comment.nickName} &nbsp;
                          <p>
                            {elapsedTime(comment.date)}&nbsp;{comment.edited}
                          </p>
                        </Nickname>

                        {editingCommentId === comment.commentId ? (
                          <>
                            <CommentInput
                              type="text"
                              value={editedComment}
                              onChange={(e) => setEditedComment(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editingCommentId === comment.commentId) {
                                    handleSaveEdit(comment.commentId, comment.postId);
                                  }
                                }
                              }}
                            />
                            <CommentButton
                              onClick={() => {
                                handleSaveEdit(comment.commentId, comment.postId);
                              }}
                            >
                              저장
                            </CommentButton>
                          </>
                        ) : (
                          <div style={{ display: "flex" }}>
                            <div
                              style={{
                                marginTop: "1rem",
                                marginLeft: "1.7rem",
                                display: "flex",
                                backgroundColor: "#F2F2F5",
                                borderRadius: "7px",
                              }}
                            >
                              {comment.comment}

                              {comment.userId === userId && (
                                <div>
                                  <CommentButton onClick={() => handleEdit(comment.commentId, comment.comment)}>
                                    수정
                                  </CommentButton>
                                  <CommentButton
                                    onClick={() => {
                                      if (window.confirm("삭제하시겠습니까?")) {
                                        deleteCommentMutation.mutate(comment.commentId);
                                      }
                                    }}
                                  >
                                    삭제
                                  </CommentButton>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CommentWrap>
                )
            )}
          </ModalContent>
        </ModalWrapper>
      )}
    </>
  );
}

export default PostingModal;
const ProfileBox = styled.div`
  width: 4em;
  height: 4rem;
  border-radius: 50%;
  background-color: #ffffff;
  background-image: url(${(props) => props.photo});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
`;
const Place = styled.div`
  float: left;
`;
const DetailLocation = styled.span`
  color: #5a5a68;
  font-size: 0.9rem;
  float: left;
  margin-left: 0.2rem;
`;
const DateDiv = styled.span`
  color: #5a5a68;
  font-size: 0.9rem;
`;
