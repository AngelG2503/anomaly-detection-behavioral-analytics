import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await profileAPI.get();
            setUser(response.data);
            setFormData({
                name: response.data.name,
                email: response.data.email
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await profileAPI.update(formData);
            toast.success('✅ Profile updated successfully!');
            setEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('❌ Failed to update profile');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('❌ Passwords do not match!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('❌ Password must be at least 6 characters');
            return;
        }

        try {
            await profileAPI.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            toast.success('✅ Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordForm(false);
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('❌ Failed to change password');
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="page-header">
                <h2>👤 My Profile</h2>
                <p>Manage your account settings</p>
            </div>

            {/* Profile Information Card */}
            <div className="profile-card">
                <div className="card-header">
                    <h3>Profile Information</h3>
                    {!editing && (
                        <button 
                            className="btn-edit"
                            onClick={() => setEditing(true)}
                        >
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateProfile} className="profile-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-save">
                                💾 Save Changes
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={() => {
                                    setEditing(false);
                                    setFormData({
                                        name: user.name,
                                        email: user.email
                                    });
                                }}
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-item">
                            <span className="label">Name:</span>
                            <span className="value">{user?.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Email:</span>
                            <span className="value">{user?.email}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Account Created:</span>
                            <span className="value">
                                {new Date(user?.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Password Card */}
            <div className="profile-card">
                <div className="card-header">
                    <h3>Security</h3>
                    {!showPasswordForm && (
                        <button 
                            className="btn-edit"
                            onClick={() => setShowPasswordForm(true)}
                        >
                            🔒 Change Password
                        </button>
                    )}
                </div>

                {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="profile-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-save">
                                🔒 Update Password
                            </button>
                            <button 
                                type="button" 
                                className="btn-cancel"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                }}
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
