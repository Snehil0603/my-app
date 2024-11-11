import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../navbar/Navbar";
import Footer from "../footer/Footer";
import CommentsSection from "../commentSection/CommentsSection";
import { FaStar, FaThumbsUp, FaShareSquare, FaEye } from "react-icons/fa";
import "./newsPage.css"

const NewsPage = () => {
    const location = useLocation();
    const article = location.state?.article;
    const [isFavorited, setIsFavorited] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [commentsVisible, setCommentsVisible] = useState(false);

    const userId = localStorage.getItem("userId");
    const newsId = `${article.title.replace(/\s+/g, '-').toLowerCase()}-${article.publishedAt}`;
    
    useEffect(() => {
        if (article) {
            checkFavoriteStatus();
            checkLikeStatus();
            fetchLikesCount();
        }
    }, [article]);

    const checkFavoriteStatus = () => {
        // Fetch favorite status directly from backend
        axios.post("http://localhost:5000/server/favorite/favorited", {
            newsId,
            userFrom: userId,
        }).then(response => {
            if (response.data.success) {
                console.log(newsId);
                setIsFavorited(response.data.subscribed);
            }
        }).catch(error => {
            console.error("Error fetching favorite status:", error);
        });
    };

const toggleFavorite = () => {
    const newFavoriteStatus = !isFavorited;

    if (newFavoriteStatus) {
        axios.post("http://localhost:5000/server/favorite/addToFavorite", {
            userFrom: userId,
            newsId,
            title: article.title,
            description: article.description,
            urlToImage: article.urlToImage,
            publishedAt: article.publishedAt,
        })
        .then(() => {
            setIsFavorited(true);
            checkFavoriteStatus(); // Re-fetch favorite status
        })
        .catch(error => {
            console.error("Error adding to favorites:", error);
        });
    } else {
        axios.post("http://localhost:5000/server/favorite/removeFromFavorite", {
            newsId,
            userFrom: userId,
        })
        .then(() => {
            setIsFavorited(false);
            checkFavoriteStatus(); // Re-fetch favorite status
        })
        .catch(error => {
            console.error("Error removing from favorites:", error);
        });
    }
};


    const checkLikeStatus = () => {
        axios.post("http://localhost:5000/server/like/getLikes", { newsId, userId })
            .then(response => {
                if (response.data.success) {
                    setIsLiked(response.data.likes.some(like => like.userId === userId));
                }
            });
    };

    const fetchLikesCount = () => {
        axios.post("http://localhost:5000/server/like/getLikes", { newsId })
            .then(response => {
                if (response.data.success) {
                    setLikes(response.data.likes.length);
                }
            });
    };


    const toggleLike = () => {
        const url = isLiked ? "unLike" : "upLike";
        axios.post(`http://localhost:5000/server/like/${url}`, { newsId, userId })
            .then(() => {
                setLikes(prev => prev + (isLiked ? -1 : 1));
                setIsLiked(!isLiked);
            });
    };

    const shareArticle = async () => {
        const shareData = {
            title: article.title,
            text: article.description,
            url: article.url || window.location.href,
        };
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(article.url);
            alert("Link copied to clipboard!");
        }
    };

    const toggleCommentsVisibility = () => {
        setCommentsVisible(!commentsVisible);
    };

    if (!article) return <p>Article not found</p>;

    return (
        <>
            <Navbar />
            <div className="news-page">
                {article.urlToImage && (
                    <img src={article.urlToImage} alt={article.title} className="article-image" />
                )}
                <div className="content-details">
                    <h2>{article.title}</h2>
                    <p className="meta-info date"><strong>Published on:</strong> {new Date(article.publishedAt).toLocaleDateString()}</p>
                    <p className="meta-info author"><strong>Author:</strong> {article.author || "Unknown"}</p>
                    <p>{article.description}</p>
                    <div className="all-icons">
                        <FaStar onClick={toggleFavorite} className={`icon favorite-icon ${isFavorited ? "active" : ""}`} />
                        <FaShareSquare onClick={shareArticle} className="icon share-icon" />
                        <div style={{'display':'flex','alignItems':'center'}}>
                        <FaThumbsUp onClick={toggleLike} className={`icon like-icon ${isLiked ? "active" : ""}`} />
                        <span>{likes}</span>
                        </div>
                        <div style={{'display':'flex','alignItems':'center'}}>
                        <FaEye onClick={toggleCommentsVisibility} className="icon eye-icon" />
                        <span>{commentsVisible ? "Hide Comments" : "Show Comments"}</span>
                        </div>
                    </div>
                    {commentsVisible && <CommentsSection newsId={newsId} userId={userId} />}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default NewsPage;