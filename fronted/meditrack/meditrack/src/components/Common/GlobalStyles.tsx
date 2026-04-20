// components/Common/GlobalStyles.tsx
import React from 'react';

const GlobalStyles: React.FC = () => {
  return (
    <style>{`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #D6EFFF;
        min-height: 100vh;
      }

      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
      }

      .auth-box {
        background: white;
        padding: 40px;
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 450px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .auth-box h2 {
        color: #2C5F7C;
        margin-bottom: 30px;
        text-align: center;
        font-size: 28px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: 500;
      }

      .form-group input, .form-group select {
        width: 100%;
        padding: 12px;
        border: 2px solid #D6EFFF;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s;
      }

      .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #2C5F7C;
      }

      .btn-primary {
        width: 100%;
        padding: 14px;
        background: #2C5F7C;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 10px;
      }

      .btn-primary:hover {
        background: #1E4A61;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(44, 95, 124, 0.3);
      }

      .auth-toggle {
        text-align: center;
        margin-top: 20px;
        color: #666;
      }

      .auth-toggle a {
        color: #2C5F7C;
        text-decoration: none;
        font-weight: 600;
        cursor: pointer;
      }

      .auth-toggle a:hover {
        text-decoration: underline;
      }

      .dashboard {
        display: none;
      }

      .header {
        background: white;
        padding: 15px 30px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #2C5F7C;
      }

      .notification-icon {
        position: relative;
        cursor: pointer;
        font-size: 24px;
        color: #2C5F7C;
      }

      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #FF6B6B;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        font-weight: bold;
      }

      .notification-dropdown {
        display: none;
        position: absolute;
        top: 60px;
        right: 30px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 350px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
      }

      .notification-item {
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.3s;
      }

      .notification-item:hover {
        background: #f8f9fa;
      }

      .notification-item h4 {
        color: #2C5F7C;
        margin-bottom: 5px;
      }

      .notification-item p {
        color: #666;
        font-size: 14px;
      }

      .nav-tabs {
        background: white;
        display: flex;
        justify-content: flex-start;
        padding: 0;
        padding-left: 20px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }

      .nav-tab {
        padding: 18px 35px;
        cursor: pointer;
        color: #666;
        font-weight: 500;
        border-bottom: 3px solid transparent;
        transition: all 0.3s;
        font-size: 15px;
      }

      .nav-tab:hover {
        color: #2C5F7C;
        background: #f8f9fa;
      }

      .nav-tab.active {
        color: #2C5F7C;
        border-bottom-color: #2C5F7C;
      }

      .content {
        padding: 30px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .section {
        display: none;
      }

      .section.active {
        display: block;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 25px;
        margin-bottom: 30px;
      }

      .stat-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        transition: all 0.3s;
      }

      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
      }

      .stat-card h3 {
        color: #2C5F7C;
        margin-bottom: 10px;
        font-size: 18px;
      }

      .stat-card .number {
        font-size: 36px;
        font-weight: bold;
        color: #2C5F7C;
        margin: 10px 0;
      }

      .stat-card .label {
        color: #666;
        font-size: 14px;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .action-btn {
        padding: 20px;
        background: white;
        border: 2px solid #2C5F7C;
        border-radius: 12px;
        color: #2C5F7C;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-align: center;
        font-size: 16px;
      }

      .action-btn:hover {
        background: #2C5F7C;
        color: white;
        transform: scale(1.05);
      }

      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        overflow-y: auto;
      }

      .modal.active {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .modal-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        border-bottom: 2px solid #D6EFFF;
        padding-bottom: 15px;
      }

      .modal-header h3 {
        color: #2C5F7C;
        font-size: 24px;
      }

      .close-modal {
        font-size: 28px;
        cursor: pointer;
        color: #999;
        transition: color 0.3s;
      }

      .close-modal:hover {
        color: #FF6B6B;
      }

      .table-container {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        background: #2C5F7C;
        color: white;
        padding: 15px;
        text-align: left;
        font-weight: 600;
      }

      td {
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
        color: #333;
      }

      tr:hover {
        background: #f8f9fa;
      }

      .action-icons {
        display: flex;
        gap: 10px;
      }

      .action-icons span {
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 5px;
        transition: all 0.3s;
      }

      .action-icons .edit:hover {
        background: #4CAF50;
        color: white;
      }

      .action-icons .delete:hover {
        background: #FF6B6B;
        color: white;
      }

      .action-icons .view:hover {
        background: #2C5F7C;
        color: white;
      }

      .btn-secondary {
        width: 100%;
        padding: 14px;
        background: #95a5a6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 10px;
      }

      .btn-secondary:hover {
        background: #7f8c8d;
      }

      .hidden {
        display: none !important;
      }

      .payment-option {
        padding: 15px;
        border: 2px solid #D6EFFF;
        border-radius: 8px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .payment-option:hover {
        border-color: #2C5F7C;
        background: #f8f9fa;
      }

      .payment-option input[type="radio"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .payment-step {
        margin-bottom: 20px;
      }

      .payment-type-link {
        display: block;
        padding: 20px;
        background: white;
        border: 2px solid #D6EFFF;
        border-radius: 10px;
        margin-bottom: 15px;
        text-decoration: none;
        color: #2C5F7C;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s;
        text-align: center;
      }

      .payment-type-link:hover {
        background: #2C5F7C;
        color: white;
        transform: scale(1.02);
      }

      .settings-tabs {
        display: flex;
        border-bottom: 2px solid #e0e0e0;
        margin-bottom: 20px;
      }

      .settings-tab {
        padding: 15px 25px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        color: #666;
        font-weight: 500;
        transition: all 0.3s;
      }

      .settings-tab:hover {
        color: #2C5F7C;
        background: #f8f9fa;
      }

      .settings-tab.active {
        color: #2C5F7C;
        border-bottom-color: #2C5F7C;
      }

      .settings-section {
        display: none;
      }

      .settings-section.active {
        display: block;
      }

      .checkbox-group {
        margin-bottom: 15px;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border: 2px solid #D6EFFF;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 10px;
      }

      .checkbox-group label:hover {
        border-color: #2C5F7C;
        background: #f8f9fa;
      }

      .checkbox-group input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .family-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 15px;
        border: 1px solid #e0e0e0;
        transition: all 0.3s;
      }

      .family-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .family-card h4 {
        color: #2C5F7C;
        margin-bottom: 10px;
      }

      .family-card p {
        color: #666;
        margin-bottom: 5px;
      }

      .family-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }

      .family-actions button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
      }

      .btn-edit {
        background: #4CAF50;
        color: white;
      }

      .btn-edit:hover {
        background: #45a049;
      }

      .btn-delete {
        background: #FF6B6B;
        color: white;
      }

      .btn-delete:hover {
        background: #ff5252;
      }

      .btn-view {
        background: #2C5F7C;
        color: white;
      }

      .btn-view:hover {
        background: #1E4A61;
      }

      @media (max-width: 768px) {
        .header {
          padding: 15px;
        }

        .logo {
          font-size: 20px;
        }

        .nav-tabs {
          overflow-x: auto;
          padding-left: 10px;
        }

        .nav-tab {
          padding: 15px 20px;
          font-size: 14px;
          white-space: nowrap;
        }

        .content {
          padding: 15px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .action-buttons {
          grid-template-columns: 1fr;
        }

        .modal-content {
          padding: 20px;
        }

        .settings-tabs {
          overflow-x: auto;
        }

        .settings-tab {
          padding: 12px 20px;
          white-space: nowrap;
        }
      }
    `}</style>
  );
};

export default GlobalStyles;
