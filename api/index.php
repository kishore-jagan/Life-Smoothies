<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400'); // Cache preflight response for 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
require_once 'db.php';

// Ensure server uses local timezone for all PHP date() calls
// Adjust this if your server is in a different region
date_default_timezone_set('Asia/Dubai');

// Ensure MySQL session also uses the same timezone (for CURRENT_TIMESTAMP, etc.)
if (isset($mysqli) && $mysqli instanceof mysqli) {
    @mysqli_query($mysqli, "SET time_zone = '+04:00'");
}

// Helper function to get JSON input
function getJsonInput()
{
    return json_decode(file_get_contents('php://input'), true);
}

// Helper function to send JSON response
function sendResponse($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Helper function to escape SQL values
function escape($mysqli, $value)
{
    return mysqli_real_escape_string($mysqli, $value);
}


// Routing based on 'action' query parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    // Role APIs
    case 'addRole':
        $data = getJsonInput();
        $name = isset($data['name']) ? escape($mysqli, $data['name']) : '';
        $description = isset($data['description']) ? escape($mysqli, $data['description']) : '';
        $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : '{}';

        if (!$name) {
            sendResponse(['error' => 'Name is required'], 400);
        }

        $query = "INSERT INTO sm_roles (name, description, permissions) VALUES (?, ?, ?)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'sss', $name, $description, $permissions);

        if (mysqli_stmt_execute($stmt)) {
            $id = mysqli_insert_id($mysqli);
            $result = mysqli_query($mysqli, "SELECT * FROM sm_roles WHERE id = $id");
            sendResponse(mysqli_fetch_assoc($result));
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getQtyLogs':
        $entity = isset($_GET['entity']) ? $_GET['entity'] : '';
        $entity_id = isset($_GET['entity_id']) ? (int)$_GET['entity_id'] : 0;
        if (!$entity || !$entity_id) {
            sendResponse(['error' => 'Entity and entity_id are required'], 400);
        }
        $sql = "SELECT * FROM storage_qty_logs WHERE entity = ? AND entity_id = ? ORDER BY created_at DESC, id DESC";
        $stmt = mysqli_prepare($mysqli, $sql);
        mysqli_stmt_bind_param($stmt, 'si', $entity, $entity_id);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        $res = mysqli_stmt_get_result($stmt);
        $rows = [];
        while ($r = mysqli_fetch_assoc($res)) {
            $rows[] = $r;
        }
        mysqli_stmt_close($stmt);
        sendResponse($rows);
        break;

    case 'getQtyLogsSum':
        $entity = isset($_GET['entity']) ? $_GET['entity'] : '';
        if (!$entity) {
            sendResponse(['error' => 'Entity is required'], 400);
        }
        $sql = "SELECT entity, entity_id, SUM(addedqty) AS total_added FROM storage_qty_logs WHERE entity = ? GROUP BY entity, entity_id";
        $stmt = mysqli_prepare($mysqli, $sql);
        mysqli_stmt_bind_param($stmt, 's', $entity);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        $res = mysqli_stmt_get_result($stmt);
        $rows = [];
        while ($r = mysqli_fetch_assoc($res)) {
            $rows[] = $r;
        }
        mysqli_stmt_close($stmt);
        sendResponse($rows);
        break;

    case 'getQtyLogsLatest':
        $entity = isset($_GET['entity']) ? $_GET['entity'] : '';
        if (!$entity) {
            sendResponse(['error' => 'Entity is required'], 400);
        }

        $sql = "
            SELECT l.*
            FROM storage_qty_logs l
            INNER JOIN (
                SELECT entity_id, MAX(created_at) AS max_created
                FROM storage_qty_logs
                WHERE entity = ?
                GROUP BY entity_id
            ) x ON x.entity_id = l.entity_id AND l.created_at = x.max_created
            WHERE l.entity = ?
        ";
        $stmt = mysqli_prepare($mysqli, $sql);
        mysqli_stmt_bind_param($stmt, 'ss', $entity, $entity);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        $res = mysqli_stmt_get_result($stmt);
        $rows = [];
        while ($r = mysqli_fetch_assoc($res)) {
            $rows[] = $r;
        }
        mysqli_stmt_close($stmt);
        sendResponse($rows);
        break;

    case 'addQtyLog':
        $data = getJsonInput();
        $entity = isset($data['entity']) ? $data['entity'] : '';
        $entity_id = isset($data['entity_id']) ? (int)$data['entity_id'] : 0;
        $addedqty = isset($data['addedqty']) ? (float)$data['addedqty'] : null;
        $remark = isset($data['remark']) ? $data['remark'] : '';
        $user = isset($data['user']) ? $data['user'] : '';

        if (!$entity || !$entity_id || $addedqty === null || $addedqty <= 0) {
            sendResponse(['error' => 'Invalid parameters'], 400);
        }

        $created_at = date('Y-m-d H:i:s');
        $query = "INSERT INTO storage_qty_logs (entity, entity_id, addedqty, remark, user, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'sidsss', $entity, $entity_id, $addedqty, $remark, $user, $created_at);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        $id = mysqli_insert_id($mysqli);
        mysqli_stmt_close($stmt);

        sendResponse(['id' => $id, 'entity' => $entity, 'entity_id' => $entity_id, 'addedqty' => $addedqty, 'remark' => $remark, 'user' => $user, 'created_at' => $created_at]);
        break;

    case 'fetchRole':
        $query = "
            SELECT r.id, r.name, r.description, r.permissions,
                   COUNT(u.id) AS user_count
            FROM sm_roles r
            LEFT JOIN sm_users u ON u.role_id = r.id
            GROUP BY r.id, r.name, r.description, r.permissions
            ORDER BY r.id ASC";
        $result = mysqli_query($mysqli, $query);
        $roles = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['permissions'] = json_decode($row['permissions'], true);
            $roles[] = $row;
        }
        sendResponse($roles);
        break;

    case 'updateRole':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $data = getJsonInput();
        $name = isset($data['name']) ? escape($mysqli, $data['name']) : '';
        $description = isset($data['description']) ? escape($mysqli, $data['description']) : '';
        $permissions = isset($data['permissions']) ? json_encode($data['permissions']) : '{}';

        if (!$id || !$name) {
            sendResponse(['error' => 'ID and name are required'], 400);
        }

        $query = "UPDATE sm_roles SET name = ?, description = ?, permissions = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'sssi', $name, $description, $permissions, $id);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_query($mysqli, "SELECT * FROM sm_roles WHERE id = $id");
            if (mysqli_num_rows($result) > 0) {
                sendResponse(mysqli_fetch_assoc($result));
            } else {
                sendResponse(['error' => 'Role not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'deleteRole':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "DELETE FROM sm_roles WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $id);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                sendResponse(['message' => 'Role deleted successfully']);
            } else {
                sendResponse(['error' => 'Role not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    // User APIs
    case 'addUser':
        $data = getJsonInput();
        $full_name = isset($data['full_name']) ? escape($mysqli, $data['full_name']) : '';
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $email = isset($data['email']) ? escape($mysqli, $data['email']) : '';
        $designation = isset($data['designation']) ? escape($mysqli, $data['designation']) : '';
        $role_id = isset($data['role_id']) ? (int) $data['role_id'] : 0;
        $status = isset($data['status']) ? ($data['status'] ? 1 : 0) : 0;
        $password = isset($data['password']) ? $data['password'] : '';
        $is_admin = isset($data['is_admin']) ? ($data['is_admin'] ? 1 : 0) : 0;
        $parameters = isset($data['parameters']) ? json_encode($data['parameters']) : '{}';

        if (!$user_name || !$password) {
            sendResponse(['error' => 'Username and password are required'], 400);
        }

        mysqli_begin_transaction($mysqli);
        try {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $query = "INSERT INTO sm_users (full_name, user_name, email, designation, role_id, status, password, is_admin, parameters, created_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
            $stmt = mysqli_prepare($mysqli, $query);
            mysqli_stmt_bind_param($stmt, 'ssssiisis', $full_name, $user_name, $email, $designation, $role_id, $status, $hashedPassword, $is_admin, $parameters);

            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            $user_id = mysqli_insert_id($mysqli);
            if ($status == 1) {
                $log_query = "INSERT INTO sm_status_logs (user_id, activated_at) VALUES (?, CURRENT_TIMESTAMP)";
                $log_stmt = mysqli_prepare($mysqli, $log_query);
                mysqli_stmt_bind_param($log_stmt, 'i', $user_id);
                if (!mysqli_stmt_execute($log_stmt)) {
                    throw new Exception(mysqli_error($mysqli));
                }
                mysqli_stmt_close($log_stmt);
            }

            mysqli_commit($mysqli);
            $result = mysqli_query($mysqli, "SELECT id, status FROM sm_users WHERE id = $user_id");
            sendResponse(mysqli_fetch_assoc($result));
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['error' => $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'fetchUsers':
        $query = "
            SELECT u.id, u.full_name, u.user_name, u.email, u.designation,
                   u.status, u.is_admin, u.parameters, u.created_at,
                   r.id AS role_id, r.name AS role_name
            FROM sm_users u
            LEFT JOIN sm_roles r ON u.role_id = r.id
            ORDER BY u.id ASC";
        $result = mysqli_query($mysqli, $query);
        $users = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['parameters'] = json_decode($row['parameters'], true);
            $users[] = $row;
        }
        sendResponse($users);
        break;

    case 'updateUser':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $data = getJsonInput();
        $full_name = isset($data['full_name']) ? escape($mysqli, $data['full_name']) : '';
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $email = isset($data['email']) ? escape($mysqli, $data['email']) : '';
        $designation = isset($data['designation']) ? escape($mysqli, $data['designation']) : '';
        $role_id = isset($data['role_id']) ? (int) $data['role_id'] : 0;
        $status = isset($data['status']) ? ($data['status'] ? 1 : 0) : 0;
        $password = isset($data['password']) ? $data['password'] : null;
        $parameters = isset($data['parameters']) ? json_encode($data['parameters']) : '{}';

        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $result = mysqli_query($mysqli, "SELECT status FROM sm_users WHERE id = $id");
        if (mysqli_num_rows($result) == 0) {
            sendResponse(['error' => 'User not found'], 404);
        }
        $currentStatus = mysqli_fetch_assoc($result)['status'];

        $query = $password ?
            "UPDATE sm_users SET full_name = ?, user_name = ?, email = ?, designation = ?, role_id = ?, status = ?, password = ?, parameters = ? WHERE id = ?" :
            "UPDATE sm_users SET full_name = ?, user_name = ?, email = ?, designation = ?, role_id = ?, status = ?, parameters = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        if ($password) {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            mysqli_stmt_bind_param($stmt, 'ssssisssi', $full_name, $user_name, $email, $designation, $role_id, $status, $hashedPassword, $parameters, $id);
        } else {
            mysqli_stmt_bind_param($stmt, 'ssssissi', $full_name, $user_name, $email, $designation, $role_id, $status, $parameters, $id);
        }

        mysqli_begin_transaction($mysqli);
        try {
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }
            if (mysqli_affected_rows($mysqli) == 0) {
                throw new Exception('User not found');
            }

            if ($status != $currentStatus) {
                if ($status == 1) {
                    $log_query = "INSERT INTO sm_status_logs (user_id, activated_at) VALUES (?, CURRENT_TIMESTAMP)";
                    $log_stmt = mysqli_prepare($mysqli, $log_query);
                    mysqli_stmt_bind_param($log_stmt, 'i', $id);
                    mysqli_stmt_execute($log_stmt);
                    mysqli_stmt_close($log_stmt);
                } else {
                    $log_query = "UPDATE sm_status_logs 
                                  SET inactivated_at = CURRENT_TIMESTAMP 
                                  WHERE user_id = ? AND inactivated_at IS NULL 
                                  ORDER BY activated_at DESC LIMIT 1";
                    $log_stmt = mysqli_prepare($mysqli, $log_query);
                    mysqli_stmt_bind_param($log_stmt, 'i', $id);
                    mysqli_stmt_execute($log_stmt);
                    mysqli_stmt_close($log_stmt);
                }
            }

            mysqli_commit($mysqli);
            $result = mysqli_query($mysqli, "SELECT * FROM sm_users WHERE id = $id");
            sendResponse(mysqli_fetch_assoc($result));
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['error' => $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'deleteUser':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "DELETE FROM sm_users WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $id);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                sendResponse(['message' => 'User deleted successfully']);
            } else {
                sendResponse(['error' => 'User not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getAllusers':
        $query = "
            SELECT
                u.id AS user_id, u.full_name, u.user_name, u.email, u.designation,
                u.status, u.failed_attempts, u.on_hold_time, u.is_admin, u.created_at, u.parameters,
                r.name AS role_name, r.description AS role_description, r.permissions AS role_permissions,
                s.login_time, s.logout_time, s.active_hours,
                st.activated_at AS latest_status, st.inactivated_at AS status_changed_at, st.active_duration AS duration
            FROM sm_users u
            LEFT JOIN sm_roles r ON u.role_id = r.id
            LEFT JOIN sm_session_logs s ON s.user_id = u.id
                AND s.login_time = (SELECT MAX(s2.login_time) FROM sm_session_logs s2 WHERE s2.user_id = u.id)
            LEFT JOIN sm_status_logs st ON st.user_id = u.id
                AND st.activated_at = (SELECT MAX(st2.activated_at) FROM sm_status_logs st2 WHERE st2.user_id = u.id)
            ORDER BY u.created_at DESC";
        $result = mysqli_query($mysqli, $query);
        $users = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['parameters'] = json_decode($row['parameters'], true);
            $row['role_permissions'] = json_decode($row['role_permissions'], true);
            $users[] = $row;
        }
        sendResponse($users);
        break;

    case 'getUserDetails':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "
            SELECT
                u.id, u.full_name, u.user_name, u.email, u.designation,
                u.status, u.failed_attempts, u.on_hold_time, u.is_admin, u.created_at, u.parameters,
                r.name AS role_name, r.description AS role_description, r.permissions AS role_permissions,
                s.login_time, s.logout_time, s.active_hours,
                st.activated_at AS latest_status, st.inactivated_at AS status_changed_at, st.active_duration AS duration
            FROM sm_users u
            LEFT JOIN sm_roles r ON u.role_id = r.id
            LEFT JOIN sm_session_logs s ON s.user_id = u.id
                AND s.login_time = (SELECT MAX(s2.login_time) FROM sm_session_logs s2 WHERE s2.user_id = u.id)
            LEFT JOIN sm_status_logs st ON st.user_id = u.id
                AND st.activated_at = (SELECT MAX(st2.activated_at) FROM sm_status_logs st2 WHERE st2.user_id = u.id)
            WHERE u.id = ?
            ORDER BY u.created_at DESC LIMIT 1";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $id);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            if ($row = mysqli_fetch_assoc($result)) {
                $row['parameters'] = json_decode($row['parameters'], true);
                $row['role_permissions'] = json_decode($row['role_permissions'], true);
                sendResponse($row);
            } else {
                sendResponse(['message' => 'User not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'updateUserStatus':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $data = getJsonInput();
        $status = isset($data['status']) ? ($data['status'] ? 1 : 0) : 0;

        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "UPDATE sm_users SET status = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ii', $status, $id);

        mysqli_begin_transaction($mysqli);
        try {
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }
            if (mysqli_affected_rows($mysqli) == 0) {
                throw new Exception('User not found');
            }

            $log_query = $status ?
                "INSERT INTO sm_status_logs (user_id, activated_at) VALUES (?, CURRENT_TIMESTAMP)" :
                "UPDATE sm_status_logs SET inactivated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND inactivated_at IS NULL LIMIT 1";
            $log_stmt = mysqli_prepare($mysqli, $log_query);
            mysqli_stmt_bind_param($log_stmt, 'i', $id);
            mysqli_stmt_execute($log_stmt);
            $log_result = $status ? mysqli_insert_id($mysqli) : mysqli_affected_rows($mysqli);
            mysqli_stmt_close($log_stmt);

            mysqli_commit($mysqli);
            $result = mysqli_query($mysqli, "SELECT id, status FROM sm_users WHERE id = $id");
            sendResponse([
                'user' => mysqli_fetch_assoc($result),
                'log' => $log_result ? ['affected' => $log_result] : null
            ]);
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['error' => $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getroles':
        $result = mysqli_query($mysqli, "SELECT * FROM sm_roles");
        $roles = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['permissions'] = json_decode($row['permissions'], true);
            $roles[] = $row;
        }
        sendResponse($roles);
        break;

    case 'checkusername':
        $data = getJsonInput();
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $email = isset($data['email']) ? escape($mysqli, $data['email']) : '';

        $query = "SELECT COUNT(*) AS count FROM sm_users WHERE user_name = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 's', $user_name);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $username_count = mysqli_fetch_assoc($result)['count'];
        mysqli_stmt_close($stmt);

        $query = "SELECT COUNT(*) AS count FROM sm_users WHERE email = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 's', $email);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $email_count = mysqli_fetch_assoc($result)['count'];
        mysqli_stmt_close($stmt);

        sendResponse([
            'usernameExists' => $username_count > 0,
            'emailExists' => $email_count > 0
        ]);
        break;

    case 'getCounts':
        $query = "
            SELECT
                (SELECT COUNT(*) FROM sm_users) AS total_users,
                (SELECT COUNT(*) FROM sm_roles) AS total_roles,
                (SELECT COUNT(*) FROM sm_users WHERE status = 1) AS active_users,
                (SELECT COUNT(*) FROM sm_users WHERE status = 0) AS inactive_users";
        $result = mysqli_query($mysqli, $query);
        sendResponse(mysqli_fetch_assoc($result));
        break;

    case 'getUserById':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "
            SELECT
                u.id, u.full_name, u.user_name, u.email, u.designation,
                u.status, u.role_id, u.parameters, u.created_at,
                r.name AS role_name
            FROM sm_users u
            LEFT JOIN sm_roles r ON u.role_id = r.id
            WHERE u.id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $id);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            if ($row = mysqli_fetch_assoc($result)) {
                $row['parameters'] = json_decode($row['parameters'], true);
                sendResponse($row);
            } else {
                sendResponse(['message' => 'User not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'logoutUser':
        $data = getJsonInput();
        $sessionId = isset($data['sessionId']) ? (int) $data['sessionId'] : 0;
        if (!$sessionId) {
            sendResponse(['error' => 'Session ID is required'], 400);
        }

        $query = "UPDATE sm_session_logs SET logout_time = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $sessionId);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                sendResponse(['message' => 'Logout successful']);
            } else {
                sendResponse(['message' => 'Session not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'login':
        $data = getJsonInput();
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (!$user_name || !$password) {
            sendResponse(['error' => 'Username and password are required'], 400);
        }

        $query = "SELECT * FROM sm_users WHERE user_name = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 's', $user_name);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            if ($user = mysqli_fetch_assoc($result)) {

                // Check status
                if ($user['status'] == 0) {
                    sendResponse(['message' => 'User is not active. Please contact admin.'], 403);
                }

                // Verify password
                if (!password_verify($password, $user['password'])) {
                    sendResponse(['message' => 'Invalid password'], 401);
                }

                // Fetch role
                $role_query = "SELECT * FROM sm_roles WHERE id = ?";
                $role_stmt = mysqli_prepare($mysqli, $role_query);
                mysqli_stmt_bind_param($role_stmt, 'i', $user['role_id']);
                mysqli_stmt_execute($role_stmt);
                $role_result = mysqli_stmt_get_result($role_stmt);
                $role = mysqli_fetch_assoc($role_result);
                mysqli_stmt_close($role_stmt);

                // Decode permissions JSON
                $permissions = [];
                if (isset($role['permissions'])) {
                    $permissions = json_decode($role['permissions'], true);
                    if (!is_array($permissions)) {
                        $permissions = [];
                    }
                }

                // Create session
                $session_query = "INSERT INTO sm_session_logs (user_id, login_time) VALUES (?, CURRENT_TIMESTAMP)";
                $session_stmt = mysqli_prepare($mysqli, $session_query);
                mysqli_stmt_bind_param($session_stmt, 'i', $user['id']);
                mysqli_stmt_execute($session_stmt);
                $session_id = mysqli_insert_id($mysqli);
                mysqli_stmt_close($session_stmt);

                // Send response
                sendResponse([
                    'message' => 'Login successful',
                    'user' => [
                        'id' => $user['id'],
                        'full_name' => $user['full_name'],
                        'user_name' => $user['user_name'],
                        'role' => $role['name'],
                        'permissions' => $permissions
                    ],
                    'sessionId' => $session_id
                ]);

            } else {
                sendResponse(['message' => 'User not found'], 401);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }

        mysqli_stmt_close($stmt);
        break;


    case 'forget_password_request':
        $data = getJsonInput();
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $email_id = isset($data['email_id']) ? escape($mysqli, $data['email_id']) : '';

        $query = "SELECT * FROM sm_users WHERE user_name = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 's', $user_name);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $users = mysqli_fetch_all($result, MYSQLI_ASSOC);
            if (count($users) == 0) {
                sendResponse(['valid' => false, 'reason' => 'username']);
            }
            $emailMatch = array_filter($users, fn($u) => $u['email'] === $email_id);
            if (count($emailMatch) == 0) {
                sendResponse(['valid' => false, 'reason' => 'email']);
            }
            sendResponse(['valid' => true]);
        } else {
            sendResponse(['message' => 'Server error'], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'forget_password':
        $data = getJsonInput();
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $email_id = isset($data['email_id']) ? escape($mysqli, $data['email_id']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        $query = "SELECT * FROM sm_users WHERE user_name = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 's', $user_name);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            if ($user = mysqli_fetch_assoc($result)) {
                if ($user['email'] !== $email_id) {
                    sendResponse(['valid' => false, 'reason' => 'email']);
                }
                if (!password_verify($password, $user['password'])) {
                    sendResponse(['valid' => false, 'reason' => 'password']);
                }
                sendResponse(['valid' => true]);
            } else {
                sendResponse(['valid' => false, 'reason' => 'username']);
            }
        } else {
            sendResponse(['message' => 'Server error'], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'change_password':
        $data = getJsonInput();
        $user_name = isset($data['user_name']) ? escape($mysqli, $data['user_name']) : '';
        $newPassword = isset($data['newPassword']) ? $data['newPassword'] : '';

        if (!$user_name || !$newPassword) {
            sendResponse(['error' => 'Username and new password are required'], 400);
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        $query = "UPDATE sm_users SET password = ? WHERE user_name = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ss', $hashedPassword, $user_name);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                sendResponse(['success' => true]);
            } else {
                sendResponse(['message' => 'User not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getActiveUsers':
        $query = "
            SELECT
                s.id AS session_id, s.user_id, s.login_time,
                u.user_name, u.full_name
            FROM sm_session_logs s
            JOIN sm_users u ON s.user_id = u.id
            WHERE s.logout_time IS NULL
            ORDER BY s.login_time DESC";
        $result = mysqli_query($mysqli, $query);
        $users = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $users[] = $row;
        }
        sendResponse([
            'count' => count($users),
            'users' => $users
        ]);
        break;

    // Controller APIs
    case 'postStorage':
        $data = getJsonInput();

        $itemname = $data['itemname'] ?? '';
        $description = $data['description'] ?? '';
        $lotno = $data['lotno'] ?? '';
        $itemtype = isset($data['itemtype']) && $data['itemtype'] !== '' ? $data['itemtype'] : 'Raw';

        // ✅ No escape(), just format
        $productiondate = !empty($data['productiondate']) ? date('Y-m-d H:i:s', strtotime($data['productiondate'])) : null;
        $expirydate = !empty($data['expirydate']) ? date('Y-m-d H:i:s', strtotime($data['expirydate'])) : null;

        $qtycotton = isset($data['qtycotton']) ? (float) $data['qtycotton'] : 0;
        // $supplier = $data['supplier'] ?? '';
        // $truckno = $data['truckno'] ?? '';

        $live = date('Y-m-d H:i:s');
        $qtykg = $qtycotton * 10;
        $qtyg = $qtykg * 1000;

        $query = "INSERT INTO storage (live, itemname, description, lotno, productiondate, expirydate, qtycotton, qtykg, qtyg, itemtype) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'ssssssddds',
            $live,
            $itemname,
            $description,
            $lotno,
            $productiondate,
            $expirydate,
            $qtycotton,
            $qtykg,
            $qtyg,
            $itemtype
        );

        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        } else {
            $id = mysqli_insert_id($mysqli);
            $result = mysqli_query($mysqli, "SELECT * FROM storage WHERE id = $id");
            sendResponse(mysqli_fetch_assoc($result), 201);
        }

        mysqli_stmt_close($stmt);
        break;


    case 'postStorage2':
        $data = getJsonInput();
        $itemname = isset($data['itemname']) ? escape($mysqli, $data['itemname']) : '';
        $description = isset($data['description']) ? escape($mysqli, $data['description']) : '';
        $lotno = isset($data['lotno']) ? escape($mysqli, $data['lotno']) : '';
        $productiondate = isset($data['productiondate']) ? escape($mysqli, $data['productiondate']) : null;
        $expirydate = isset($data['expirydate']) ? escape($mysqli, $data['expirydate']) : null;
        $qtycotton = isset($data['qtycotton']) ? (float) $data['qtycotton'] : 0;
        $supplier = isset($data['supplier']) ? escape($mysqli, $data['supplier']) : '';
        $truckno = isset($data['truckno']) ? escape($mysqli, $data['truckno']) : '';

        $live = date('Y-m-d H:i:s');
        $qtykg = $qtycotton * 10;
        $qtyg = $qtykg * 1000;

        $query = "INSERT INTO storage2 (live, itemname, description, lotno, productiondate, expirydate, qtycotton, qtykg, qtyg, supplier, truckno) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'sssssddddss', $live, $itemname, $description, $lotno, $productiondate, $expirydate, $qtycotton, $qtykg, $qtyg, $supplier, $truckno);

        try {
            if (!mysqli_stmt_execute($stmt)) {
                if (mysqli_errno($mysqli) == 1062) {
                    sendResponse(['error' => 'Lot No already exists'], 400);
                }
                throw new Exception(mysqli_error($mysqli));
            }
            $id = mysqli_insert_id($mysqli);
            $result = mysqli_query($mysqli, "SELECT * FROM storage2 WHERE id = $id");
            sendResponse(mysqli_fetch_assoc($result), 201);
        } catch (Exception $e) {
            sendResponse(['error' => $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getStorageByDate':
        $fromDate = isset($_GET['fromDate']) ? escape($mysqli, $_GET['fromDate']) : '';
        $toDate = isset($_GET['toDate']) ? escape($mysqli, $_GET['toDate']) : '';

        $query = $fromDate && $toDate ?
            "SELECT * FROM storage WHERE live BETWEEN ? AND ? ORDER BY id DESC" :
            "SELECT * FROM storage ORDER BY id DESC";
        $stmt = mysqli_prepare($mysqli, $query);
        if ($fromDate && $toDate) {
            mysqli_stmt_bind_param($stmt, 'ss', $fromDate, $toDate);
        }

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getStorageByDate2':
        $fromDate = isset($_GET['fromDate']) ? escape($mysqli, $_GET['fromDate']) : '';
        $toDate = isset($_GET['toDate']) ? escape($mysqli, $_GET['toDate']) : '';

        if (!$fromDate || !$toDate) {
            sendResponse(['error' => 'fromDate and toDate are required'], 400);
        }

        $query = "SELECT * FROM storage2 WHERE live BETWEEN ? AND ? ORDER BY id ASC";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ss', $fromDate, $toDate);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'transferLifeSmoothi':
        $data = getJsonInput();
        $id = isset($data['id']) ? (int) $data['id'] : 0;
        $enteredQtyCotton = isset($data['enteredQtyCotton']) ? (float) $data['enteredQtyCotton'] : 0;
        $location = isset($data['location']) ? escape($mysqli, $data['location']) : '';

        $live = date('Y-m-d H:i:s');
        $qtykg = $enteredQtyCotton * 10;
        $qtyg = $qtykg * 1000;

        $result = mysqli_query($mysqli, "SELECT * FROM storage WHERE id = $id");
        if (mysqli_num_rows($result) == 0) {
            sendResponse(['error' => 'Item not found'], 404);
        }
        $item = mysqli_fetch_assoc($result);

        if ($enteredQtyCotton > $item['qtycotton']) {
            sendResponse(['error' => 'Not enough stock to transfer'], 400);
        }

        mysqli_begin_transaction($mysqli);
        try {
            $query = "INSERT INTO lifesmoothie (live_date, item_name, description, lot_no, location, qty_cotton, qty_kg, qty_g, production_date, expiry_date, supplier, truck_no) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = mysqli_prepare($mysqli, $query);
            mysqli_stmt_bind_param($stmt, 'sssssdddssss', $live, $item['itemname'], $item['description'], $item['lotno'], $location, $enteredQtyCotton, $qtykg, $qtyg, $item['productiondate'], $item['expirydate'], $item['supplier'], $item['truckno']);
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            $update_query = "UPDATE storage SET qtycotton = qtycotton - ?, qtykg = qtykg - ?, qtyg = qtyg - ? WHERE id = ?";
            $update_stmt = mysqli_prepare($mysqli, $update_query);
            $qtyg_update = $enteredQtyCotton * 10000;
            mysqli_stmt_bind_param($update_stmt, 'dddi', $enteredQtyCotton, $qtykg, $qtyg_update, $id);
            if (!mysqli_stmt_execute($update_stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            mysqli_commit($mysqli);
            sendResponse(['message' => 'Transfer successful']);
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['error' => 'Transfer failed: ' . $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        mysqli_stmt_close($update_stmt);
        break;

    case 'transferLifeSmoothi2':
        $data = getJsonInput();
        $id = isset($data['id']) ? (int) $data['id'] : 0;
        $enteredQtyCotton = isset($data['enteredQtyCotton']) ? (float) $data['enteredQtyCotton'] : 0;
        $location = isset($data['location']) ? escape($mysqli, $data['location']) : '';

        $live = date('Y-m-d H:i:s');
        $qtykg = $enteredQtyCotton * 10;
        $qtyg = $qtykg * 1000;

        $result = mysqli_query($mysqli, "SELECT * FROM storage2 WHERE id = $id");
        if (mysqli_num_rows($result) == 0) {
            sendResponse(['error' => 'Item not found'], 404);
        }
        $item = mysqli_fetch_assoc($result);

        if ($enteredQtyCotton > $item['qtycotton']) {
            sendResponse(['error' => 'Not enough stock to transfer'], 400);
        }

        mysqli_begin_transaction($mysqli);
        try {
            $query = "INSERT INTO lifesmoothie (live_date, item_name, description, lot_no, location, qty_cotton, qty_kg, qty_g, production_date, expiry_date, supplier, truck_no) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = mysqli_prepare($mysqli, $query);
            mysqli_stmt_bind_param($stmt, 'sssssdddssss', $live, $item['itemname'], $item['description'], $item['lotno'], $location, $enteredQtyCotton, $qtykg, $qtyg, $item['productiondate'], $item['expirydate'], $item['supplier'], $item['truckno']);
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            $update_query = "UPDATE storage2 SET qtycotton = qtycotton - ?, qtykg = qtykg - ?, qtyg = qtyg - ? WHERE id = ?";
            $update_stmt = mysqli_prepare($mysqli, $update_query);
            $qtyg_update = $enteredQtyCotton * 10000;
            mysqli_stmt_bind_param($update_stmt, 'dddi', $enteredQtyCotton, $qtykg, $qtyg_update, $id);
            if (!mysqli_stmt_execute($update_stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            mysqli_commit($mysqli);
            sendResponse(['message' => 'Transfer successful']);
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['error' => 'Transfer failed: ' . $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        mysqli_stmt_close($update_stmt);
        break;

    case 'getLifeSmoothie':
        $query = "SELECT * FROM lifesmoothie ORDER BY id DESC";
        $result = mysqli_query($mysqli, $query);
        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        sendResponse($rows);
        break;

    case 'getLifeSmoothieByDate':
        $fromDate = isset($_GET['fromDate']) ? escape($mysqli, $_GET['fromDate']) : '';
        $toDate = isset($_GET['toDate']) ? escape($mysqli, $_GET['toDate']) : '';

        if (!$fromDate || !$toDate) {
            sendResponse(['error' => 'fromDate and toDate are required'], 400);
        }

        $query = "SELECT * FROM lifesmoothie WHERE live_date BETWEEN ? AND ? ORDER BY id DESC";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ss', $fromDate, $toDate);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'postSmoothie':
        $data = getJsonInput();
        $itemname = isset($data['itemname']) ? escape($mysqli, $data['itemname']) : '';
        $ingredients = isset($data['ingredients']) ? json_encode($data['ingredients']) : '{}';
        $category = isset($data['category']) ? escape($mysqli, $data['category']) : null;
        $itemdesc = isset($data['itemdesc']) ? escape($mysqli, $data['itemdesc']) : null;

        $query = "INSERT INTO smoothies (itemname, category, itemdesc, ingredients, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ssss', $itemname, $category, $itemdesc, $ingredients);

        if (mysqli_stmt_execute($stmt)) {
            sendResponse(['message' => 'Smoothie added successfully']);
        } else {
            sendResponse(['message' => 'Failed to add smoothie', 'error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getSmoothies':
        $result = mysqli_query($mysqli, "SELECT * FROM smoothies");
        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['ingredients'] = json_decode($row['ingredients'], true);
            $rows[] = $row;
        }
        sendResponse($rows);
        break;

    case 'getIngredientsByNames':
        $data = getJsonInput();
        $names = isset($data['names']) && is_array($data['names']) ? $data['names'] : [];

        if (empty($names)) {
            sendResponse(['error' => 'No names provided'], 400);
        }

        $placeholders = implode(',', array_fill(0, count($names), '?'));
        $query = "SELECT * FROM lifesmoothie WHERE item_name IN ($placeholders)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, str_repeat('s', count($names)), ...$names);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => 'Internal server error'], 500);
        }
        mysqli_stmt_close($stmt);
        break;

        case 'saveSmoothieProduction':
            $data = getJsonInput();
            $smoothie_name = isset($data['smoothie_name']) ? escape($mysqli, $data['smoothie_name']) : '';
            $category = isset($data['category']) ? escape($mysqli, $data['category']) : null;
            $itemdesc = isset($data['itemdesc']) ? escape($mysqli, $data['itemdesc']) : null;
            $ingredients = isset($data['ingredients']) ? json_encode($data['ingredients']) : '{}';
            $rack = isset($data['rack']) ? escape($mysqli, $data['rack']) : '';
            $wastage = isset($data['wastage']) ? (float) $data['wastage'] : 0;
            $life_ids = isset($data['life_ids']) && is_array($data['life_ids']) ? $data['life_ids'] : [];
            $entered_qty = isset($data['entered_qty']) ? (float) $data['entered_qty'] : 0;
            $singleSmoothieQty_g = isset($data['singleSmoothieQty_g']) ? (float) $data['singleSmoothieQty_g'] : 0;
            $totalQtyUsed_g = isset($data['totalQtyUsed_g']) ? (float) $data['totalQtyUsed_g'] : 0;
            $totalQtyWithWastage_g = isset($data['totalQtyWithWastage_g']) ? (float) $data['totalQtyWithWastage_g'] : 0;
            $sliceQty = isset($data['sliceQty']) ? (float) $data['sliceQty'] : 0;
            $cottonQty = isset($data['cottonQty']) ? (float) $data['cottonQty'] : 0;
            $cartonvalue = isset($data['cartonvalue']) ? (float) $data['cartonvalue'] : 0;
            $production_date = isset($data['production_date']) ? escape($mysqli, $data['production_date']) : null;
            $expiry_date = isset($data['expiry_date']) ? escape($mysqli, $data['expiry_date']) : null;
    
            if (!$smoothie_name || !$ingredients || !$rack || !isset($data['wastage']) || empty($life_ids) || !$entered_qty || !$singleSmoothieQty_g || !$totalQtyUsed_g || !$totalQtyWithWastage_g || !isset($data['sliceQty']) || !isset($data['cottonQty'])) {
                sendResponse(['error' => 'Missing required fields'], 400);
            }
    
            mysqli_begin_transaction($mysqli);
            try {
                $query = "INSERT INTO smoothie_production (smoothie_name, category, itemdesc, ingredients, rack, wastage, entered_qty, one_qty_g, total_qty_g, totalqtywithwastage_g, slices, cotton, cartonvalue, production_date, expiry_date) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($mysqli, $query);
                mysqli_stmt_bind_param($stmt, 'sssssddddddddss', $smoothie_name, $category, $itemdesc, $ingredients, $rack, $wastage, $entered_qty, $singleSmoothieQty_g, $totalQtyUsed_g, $totalQtyWithWastage_g, $sliceQty, $cottonQty, $cartonvalue, $production_date, $expiry_date);
                if (!mysqli_stmt_execute($stmt)) {
                    throw new Exception(mysqli_error($mysqli));
                }
    
                $ingredientMap = [];
                foreach (json_decode($ingredients, true) as $ing) {
                    $ingredientMap[$ing['name']] = $ing['qty'];
                }
    
                foreach ($life_ids as $item) {
                    $item_id = (int) $item['id'];
                    $result = mysqli_query($mysqli, "SELECT item_name FROM lifesmoothie WHERE id = $item_id");
                    if (mysqli_num_rows($result) == 0) {
                        continue;
                    }
                    $ingredientName = mysqli_fetch_assoc($result)['item_name'];
                    $quantity = isset($ingredientMap[$ingredientName]) ? (float) $ingredientMap[$ingredientName] : null;
                    if ($quantity === null) {
                        continue;
                    }
    
                    $qty_g = $quantity * $entered_qty;
                    $qty_kg = $qty_g / 1000;
                    $qty_cotton = $qty_kg / 10;
    
                    $update_query = "UPDATE lifesmoothie SET qty_g = GREATEST(0, qty_g - ?), qty_kg = GREATEST(0, qty_kg - ?), qty_cotton = GREATEST(0, qty_cotton - ?) WHERE id = ?";
                    $update_stmt = mysqli_prepare($mysqli, $update_query);
                    mysqli_stmt_bind_param($update_stmt, 'dddi', $qty_g, $qty_kg, $qty_cotton, $item_id);
                    if (!mysqli_stmt_execute($update_stmt)) {
                        throw new Exception(mysqli_error($mysqli));
                    }
                    mysqli_stmt_close($update_stmt);
                }
    
                mysqli_commit($mysqli);
                sendResponse(['message' => 'Saved successfully']);
            } catch (Exception $e) {
                mysqli_rollback($mysqli);
                sendResponse(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
            }
            mysqli_stmt_close($stmt);
            break;
    

    case 'getSmoothieProductionByDate':
        $fromDate = isset($_GET['fromDate']) ? escape($mysqli, $_GET['fromDate']) : '';
        $toDate = isset($_GET['toDate']) ? escape($mysqli, $_GET['toDate']) : '';

        $query = $fromDate && $toDate ?
            "SELECT * FROM smoothie_production WHERE created_at BETWEEN ? AND ? ORDER BY id ASC" :
            "SELECT * FROM smoothie_production ORDER BY id ASC";
        $stmt = mysqli_prepare($mysqli, $query);
        if ($fromDate && $toDate) {
            mysqli_stmt_bind_param($stmt, 'ss', $fromDate, $toDate);
        }

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $row['ingredients'] = json_decode($row['ingredients'], true);
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getDrivers':
        $result = mysqli_query($mysqli, "SELECT * FROM drivers ORDER BY id DESC");
        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        sendResponse($rows);
        break;

    case 'addDriver':
        $data = getJsonInput();
        $driver_id = isset($data['driver_id']) ? escape($mysqli, $data['driver_id']) : '';
        $driver_name = isset($data['driver_name']) ? escape($mysqli, $data['driver_name']) : '';
        $truck_no = isset($data['truck_no']) ? escape($mysqli, $data['truck_no']) : '';
        $timestamp = date('Y-m-d H:i:s');

        $query = "INSERT INTO drivers (driver_id, driver_name, truck_no, timestamp) VALUES (?, ?, ?, ?)";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ssss', $driver_id, $driver_name, $truck_no, $timestamp);

        try {
            if (!mysqli_stmt_execute($stmt)) {
                if (mysqli_errno($mysqli) == 1062) {
                    sendResponse(['error' => 'Driver ID already exists'], 400);
                }
                throw new Exception(mysqli_error($mysqli));
            }
            $id = mysqli_insert_id($mysqli);
            $result = mysqli_query($mysqli, "SELECT * FROM drivers WHERE id = $id");
            sendResponse(mysqli_fetch_assoc($result), 201);
        } catch (Exception $e) {
            sendResponse(['error' => $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'updateDriver':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $data = getJsonInput();
        $driver_id = isset($data['driver_id']) ? escape($mysqli, $data['driver_id']) : '';
        $driver_name = isset($data['driver_name']) ? escape($mysqli, $data['driver_name']) : '';
        $truck_no = isset($data['truck_no']) ? escape($mysqli, $data['truck_no']) : '';
        $timestamp = date('Y-m-d H:i:s');

        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "UPDATE drivers SET driver_id = ?, driver_name = ?, truck_no = ?, timestamp = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'ssssi', $driver_id, $driver_name, $truck_no, $timestamp, $id);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                $result = mysqli_query($mysqli, "SELECT * FROM drivers WHERE id = $id");
                sendResponse(mysqli_fetch_assoc($result));
            } else {
                sendResponse(['error' => 'Driver not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'deleteDriver':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if (!$id) {
            sendResponse(['error' => 'ID is required'], 400);
        }

        $query = "DELETE FROM drivers WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'i', $id);

        if (mysqli_stmt_execute($stmt)) {
            if (mysqli_affected_rows($mysqli) > 0) {
                sendResponse(['message' => 'Driver deleted successfully']);
            } else {
                sendResponse(['error' => 'Driver not found'], 404);
            }
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'preDispatch':
        $data = getJsonInput();
        $driver_name = isset($data['driver_name']) ? escape($mysqli, $data['driver_name']) : '';
        $status = isset($data['status']) ? escape($mysqli, $data['status']) : '';
        $items = isset($data['items']) ? json_encode($data['items']) : '[]';

        mysqli_begin_transaction($mysqli);
        try {
            $query = "INSERT INTO predispatches (driver_name, status, items) VALUES (?, ?, ?)";
            $stmt = mysqli_prepare($mysqli, $query);
            mysqli_stmt_bind_param($stmt, 'sss', $driver_name, $status, $items);
            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }

            mysqli_commit($mysqli);
            sendResponse(['message' => 'Dispatch inserted successfully']);
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['message' => 'Dispatch insertion failed: ' . $e->getMessage()], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'getPreDispatches':
        $result = mysqli_query($mysqli, "SELECT * FROM predispatches ORDER BY dispatch_date DESC");
        $rows = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $row['items'] = json_decode($row['items'], true);
            $rows[] = $row;
        }
        sendResponse($rows);
        break;

    case 'completeDispatch':
        $data = getJsonInput();
        $pre_dispatch_id = isset($data['pre_dispatch_id']) ? (int) $data['pre_dispatch_id'] : 0;
        $driver_name = isset($data['driver_name']) ? escape($mysqli, $data['driver_name']) : '';
        $truck_no = isset($data['truck_no']) ? escape($mysqli, $data['truck_no']) : '';
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

        if (!$pre_dispatch_id || !$driver_name || !$truck_no || empty($items)) {
            sendResponse(['message' => 'Missing required fields'], 400);
        }

        mysqli_begin_transaction($mysqli);
        try {
            $query = "SELECT status FROM predispatches WHERE id = ?";
            $stmt = mysqli_prepare($mysqli, $query);
            mysqli_stmt_bind_param($stmt, 'i', $pre_dispatch_id);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $preStatus = mysqli_fetch_assoc($result)['status'] ?? '';
            mysqli_stmt_close($stmt);
            $dispatchStatus = strtolower(trim($preStatus)) === 'samples' ? 'Samples' : 'Completed';

            $insert_query = "INSERT INTO dispatches (driver_name, truck_no, creation_date, item_details, status) 
                             VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)";
            $insert_stmt = mysqli_prepare($mysqli, $insert_query);
            $items_json = json_encode($items);
            mysqli_stmt_bind_param($insert_stmt, 'ssss', $driver_name, $truck_no, $items_json, $dispatchStatus);
            if (!mysqli_stmt_execute($insert_stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }
            $dispatch_id = mysqli_insert_id($mysqli);
            mysqli_stmt_close($insert_stmt);

            $update_query = "UPDATE predispatches SET status = 'Completed' WHERE id = ?";
            $update_stmt = mysqli_prepare($mysqli, $update_query);
            mysqli_stmt_bind_param($update_stmt, 'i', $pre_dispatch_id);
            if (!mysqli_stmt_execute($update_stmt)) {
                throw new Exception(mysqli_error($mysqli));
            }
            mysqli_stmt_close($update_stmt);

            foreach ($items as $item) {
                $item_id = (int) ($item['item_id'] ?? 0);
                $net = (float) ($item['transfer_qty'] ?? 0);
                if (!$item_id || $net <= 0) {
                    continue;
                }

                // Recalculate using updated cotton (left-to-right evaluation ensures subsequent expressions see new cotton)
                $item_query = "UPDATE smoothie_production 
                               SET cotton = GREATEST(cotton - ?, 0), 
                                   entered_qty = cotton * cartonvalue, 
                                   slices = cotton * cartonvalue, 
                                   total_qty_g = cotton * cartonvalue * one_qty_g 
                               WHERE id = ?";
                $item_stmt = mysqli_prepare($mysqli, $item_query);
                mysqli_stmt_bind_param($item_stmt, 'di', $net, $item_id);
                if (!mysqli_stmt_execute($item_stmt)) {
                    throw new Exception(mysqli_error($mysqli));
                }
                mysqli_stmt_close($item_stmt);
            }

            mysqli_commit($mysqli);
            sendResponse(['message' => 'Dispatch completed', 'dispatch_id' => $dispatch_id]);
        } catch (Exception $e) {
            mysqli_rollback($mysqli);
            sendResponse(['message' => 'Complete dispatch failed: ' . $e->getMessage()], 500);
        }
        break;

    case 'getCompletedDispatches':
        $month = isset($_GET['month']) ? (int) $_GET['month'] : null;
        $year = isset($_GET['year']) ? (int) $_GET['year'] : null;

        $query = "SELECT * FROM dispatches 
                  WHERE (? IS NULL OR MONTH(creation_date) = ?) 
                    AND (? IS NULL OR YEAR(creation_date) = ?) 
                  ORDER BY creation_date DESC";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'iiii', $month, $month, $year, $year);

        if (mysqli_stmt_execute($stmt)) {
            $result = mysqli_stmt_get_result($stmt);
            $rows = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $row['item_details'] = json_decode($row['item_details'], true);
                $rows[] = $row;
            }
            sendResponse($rows);
        } else {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);
        break;

    case 'updateStorageQty':
        $data = getJsonInput();
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $qtycotton = isset($data['qtycotton']) ? (float)$data['qtycotton'] : null;
        if (!$id || $qtycotton === null || $qtycotton < 0) {
            sendResponse(['error' => 'Invalid parameters'], 400);
        }

        $qtykg = $qtycotton * 10;
        $qtyg = $qtykg * 1000;

        $query = "UPDATE storage SET qtycotton = ?, qtykg = ?, qtyg = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'dddi', $qtycotton, $qtykg, $qtyg, $id);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);

        sendResponse(['id' => $id, 'qtycotton' => $qtycotton, 'qtykg' => $qtykg, 'qtyg' => $qtyg]);
        break;

    case 'updateStorage2Qty':
        $data = getJsonInput();
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $qtycotton = isset($data['qtycotton']) ? (float)$data['qtycotton'] : null;
        if (!$id || $qtycotton === null || $qtycotton < 0) {
            sendResponse(['error' => 'Invalid parameters'], 400);
        }

        $qtykg = $qtycotton * 10;
        $qtyg = $qtykg * 1000;

        $query = "UPDATE storage2 SET qtycotton = ?, qtykg = ?, qtyg = ? WHERE id = ?";
        $stmt = mysqli_prepare($mysqli, $query);
        mysqli_stmt_bind_param($stmt, 'dddi', $qtycotton, $qtykg, $qtyg, $id);
        if (!mysqli_stmt_execute($stmt)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($stmt);

        sendResponse(['id' => $id, 'qtycotton' => $qtycotton, 'qtykg' => $qtykg, 'qtyg' => $qtyg]);
        break;

    case 'updateSmoothieCotton':
        $data = getJsonInput();
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $cotton = isset($data['cotton']) ? (float)$data['cotton'] : null;
        if (!$id || $cotton === null || $cotton < 0) {
            sendResponse(['error' => 'Invalid parameters'], 400);
        }

        // Fetch cartonvalue and one_qty_g from DB
        $q = "SELECT cartonvalue, one_qty_g FROM smoothie_production WHERE id = ?";
        $s = mysqli_prepare($mysqli, $q);
        mysqli_stmt_bind_param($s, 'i', $id);
        mysqli_stmt_execute($s);
        $res = mysqli_stmt_get_result($s);
        $row = mysqli_fetch_assoc($res);
        mysqli_stmt_close($s);
        if (!$row) {
            sendResponse(['error' => 'Record not found'], 404);
        }
        $cartonvalue = isset($row['cartonvalue']) ? (float)$row['cartonvalue'] : 0;
        $one_qty_g = isset($row['one_qty_g']) ? (float)$row['one_qty_g'] : 0;

        // Calculate fields based on DB cartonvalue
        $entered_qty = $cotton * $cartonvalue;
        $slices = $entered_qty;
        $total_qty_g = $slices * $one_qty_g;

        $update = "UPDATE smoothie_production SET cotton = ?, entered_qty = ?, slices = ?, total_qty_g = ? WHERE id = ?";
        $us = mysqli_prepare($mysqli, $update);
        mysqli_stmt_bind_param($us, 'ddddi', $cotton, $entered_qty, $slices, $total_qty_g, $id);
        if (!mysqli_stmt_execute($us)) {
            sendResponse(['error' => mysqli_error($mysqli)], 500);
        }
        mysqli_stmt_close($us);

        sendResponse([
            'id' => $id,
            'cotton' => $cotton,
            'entered_qty' => $entered_qty,
            'slices' => $slices,
            'total_qty_g' => $total_qty_g,
            'cartonvalue' => $cartonvalue,
        ]);
        break;

    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

closeConnection($mysqli);
?>