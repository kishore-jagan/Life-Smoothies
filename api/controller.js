const { error } = require('console');
const { pool } = require('./db');

const postStorage = async (req, res) => {
    const {
        itemname, description, lotno,
        productiondate, expirydate,
        qtycotton, supplier, truckno
    } = req.body;

    const live = new Date();
    const qtykg = qtycotton * 10;
    const qtyg = qtykg * 1000;

    try {
        const result = await pool.query(
            `INSERT INTO storage (
          live, itemname, description, lotno,
          productiondate, expirydate,
          qtycotton, qtykg, qtyg,
          supplier, truckno
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
            [live, itemname, description, lotno,
                productiondate, expirydate,
                qtycotton, qtykg, qtyg,
                supplier, truckno]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);

        if (err.code === '23505') { // PostgreSQL unique_violation error code
            return res.status(400).json({ error: 'Lot No already exists' });
        }

        res.status(500).json({ error: 'Failed to insert storage item' });
    }
};


const postStorage2 = async (req, res) => {
    const {
        itemname, description, lotno,
        productiondate, expirydate,
        qtycotton, supplier, truckno
    } = req.body;

    const live = new Date();
    const qtykg = qtycotton * 10;
    const qtyg = qtykg * 1000;

    try {
        const result = await pool.query(
            `INSERT INTO storage2 (
          live, itemname, description, lotno,
          productiondate, expirydate,
          qtycotton, qtykg, qtyg,
          supplier, truckno
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
            [live, itemname, description, lotno,
                productiondate, expirydate,
                qtycotton, qtykg, qtyg,
                supplier, truckno]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);

        if (err.code === '23505') { // PostgreSQL unique_violation error code
            return res.status(400).json({ error: 'Lot No already exists' });
        }

        res.status(500).json({ error: 'Failed to insert storage item' });
    }
};


// const getStorage = async (req, res) => {
//     console.log('Received request to getStorage');

//     try {
//         const result = await pool.query('SELECT * FROM storage ORDER BY id DESC');
//         ;
//         console.log('Query successful:', result.rows);
//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching getStorage data:', err.message);
//         res.status(500).json({ error: err.message });
//     }
// };

const getStorageByDate = async (req, res) => {
    console.log('Received request to getStorageByDate');
    const { fromDate, toDate } = req.query;

    try {
        const result = await pool.query(`SELECT * FROM storage WHERE live BETWEEN $1 AND $2 ORDER BY id ASC`, [fromDate, toDate]);
        console.log('Query successful:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching getStorageByDate data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const getStorageByDate2 = async (req, res) => {
    console.log('Received request to getStorageByDate2');
    const { fromDate, toDate } = req.query;

    try {
        const result = await pool.query(`SELECT * FROM storage2 WHERE live BETWEEN $1 AND $2 ORDER BY id ASC`, [fromDate, toDate]);
        console.log('Query successful:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching getStorageByDate data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const transferLifeSmoothi = async (req, res) => {
    const { id, enteredQtyCotton, location } = req.body;

    const live = new Date();
    const qtykg = enteredQtyCotton * 10;
    const qtyg = qtykg * 1000;

    try {
        // Get original item
        const original = await pool.query('SELECT * FROM storage WHERE id = $1', [id]);

        if (original.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = original.rows[0];
        if (enteredQtyCotton > item.qtycotton) {
            return res.status(400).json({ error: 'Not enough stock to transfer' });
        }

        // Insert into transferred_storage
        await pool.query(
            `INSERT INTO lifesmoothie (live_date, item_name, description, lot_no, location, qty_cotton, qty_kg, qty_g, production_date, expiry_date, supplier, truck_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [live, item.itemname, item.description, item.lotno, location, enteredQtyCotton, qtykg, qtyg, item.productiondate, item.expirydate, item.supplier, item.truckno]
        );

        // Update original storage
        await pool.query(
            `UPDATE storage SET qtycotton = qtycotton - $1, qtykg = qtykg - ($1 * 10), qtyg = qtyg - ($1 * 10000)
         WHERE id = $2`,
            [enteredQtyCotton, id]
        );

        res.status(200).json({ message: 'Transfer successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Transfer failed' });
    }
};

const transferLifeSmoothi2 = async (req, res) => {
    const { id, enteredQtyCotton, location } = req.body;

    const live = new Date();
    const qtykg = enteredQtyCotton * 10;
    const qtyg = qtykg * 1000;

    try {
        // Get original item
        const original = await pool.query('SELECT * FROM storage2 WHERE id = $1', [id]);

        if (original.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = original.rows[0];
        if (enteredQtyCotton > item.qtycotton) {
            return res.status(400).json({ error: 'Not enough stock to transfer' });
        }

        // Insert into transferred_storage
        await pool.query(
            `INSERT INTO lifesmoothie (live_date, item_name, description, lot_no, location, qty_cotton, qty_kg, qty_g, production_date, expiry_date, supplier, truck_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [live, item.itemname, item.description, item.lotno, location, enteredQtyCotton, qtykg, qtyg, item.productiondate, item.expirydate, item.supplier, item.truckno]
        );

        // Update original storage
        await pool.query(
            `UPDATE storage2 SET qtycotton = qtycotton - $1, qtykg = qtykg - ($1 * 10), qtyg = qtyg - ($1 * 10000)
         WHERE id = $2`,
            [enteredQtyCotton, id]
        );

        res.status(200).json({ message: 'Transfer successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Transfer failed' });
    }
};

const getLifeSmoothie = async (req, res) => {
    console.log('Received request to LifeSmoothie');

    try {
        const result = await pool.query('SELECT * FROM lifeSmoothie ORDER BY id DESC');
        console.log('Query successful:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching getLifeSmoothie data:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const getLifeSmoothieByDate = async (req, res) => {
    console.log('Received request to getLifeSmoothieByDate');
    const { fromDate, toDate } = req.query;

    try {
        const result = await pool.query(`SELECT * FROM lifeSmoothie WHERE live_date BETWEEN $1 AND $2 ORDER BY id ASC`, [fromDate, toDate]);
        console.log('Query successful:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching getLifeSmoothieByDate data:', err.message);
        res.status(500).json({ error: err.message });
    }
};


const postSmoothie = async (req, res) => {
    console.log('Received request to postSmoothie');

    const createDate = new Date();
    const { itemname, ingredients } = req.body;

    console.log('Received data:', { itemname, ingredients });

    const query = 'INSERT INTO smoothies (itemname, ingredients, created_at) VALUES ($1, $2, $3)';
    const values = [itemname, JSON.stringify(ingredients), createDate];

    try {
        const result = await pool.query(query, values); // ✅ fixed line
        console.log('Smoothie inserted:', result.rowCount);
        res.status(200).json({ message: 'Smoothie added successfully' });
    } catch (err) {
        console.error('Error inserting smoothie:', err.message);
        res.status(500).json({ message: 'Failed to add smoothie', error: err.message });
    }
};

const getSmoothies = async (req, res) => {
    console.log('Received request to getSmoothies');

    try {
        const result = await pool.query('SELECT * FROM smoothies');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching smoothies:', err.message);
        res.status(500).json({ error: 'Failed to fetch smoothies' });
    }
};

const getIngredientsByNames = async (req, res) => {
    const { names } = req.body; // ['IQF Banana', 'starw']

    if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: 'No names provided' });
    }

    try {
        const placeholders = names.map((_, i) => `$${i + 1}`).join(',');
        const query = `SELECT * FROM lifeSmoothie WHERE item_name IN (${placeholders})`;

        const result = await pool.query(query, names);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching ingredient details:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const saveSmoothieProduction = async (req, res) => {
    const {
        smoothie_name,
        ingredients,
        rack,
        wastage,
        life_ids,
        entered_qty, // The common quantity entered by the user
        singleSmoothieQty_g,
        totalQtyUsed_g,
        totalQtyWithWastage_g,
        sliceQty,
        cottonQty
    } = req.body;

    // Check if any required field is missing
    if (!smoothie_name || !ingredients || !rack || !wastage || !life_ids || !entered_qty || !singleSmoothieQty_g || !totalQtyUsed_g || !totalQtyWithWastage_g || sliceQty === undefined || cottonQty === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert smoothie production data with all ingredients as JSONB
        const live = new Date(); // You may want to use this value in your DB schema
        await client.query(
            `INSERT INTO Smoothie_production 
                (smoothie_name, ingredients, rack, wastage, entered_qty, one_qty_g, total_qty_g, totalQtyWithWastage_g, slices, cotton)
            VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [smoothie_name, JSON.stringify(ingredients), rack, wastage, entered_qty, singleSmoothieQty_g, totalQtyUsed_g, totalQtyWithWastage_g, sliceQty, cottonQty]
        );

        // Update each ingredient's quantity in lifeSmoothie table
        for (const item of life_ids) {
            const qty_g = item.qty;
            const qty_kg = qty_g / 1000; // Convert to kg
            const qty_cotton = qty_kg / 10; // Convert to cottons

            // Deduct the used quantity from lifeSmoothie table
            await client.query(
                `UPDATE lifeSmoothie
                    SET 
                        qty_g = qty_g::numeric - $1,
                        qty_kg = qty_kg::numeric - $2,
                        qty_cotton = qty_cotton::numeric - $3
                    WHERE id = $4`,
                [qty_g, qty_kg, qty_cotton, item.id]
            );
        }

        // Commit the transaction
        await client.query('COMMIT');
        res.json({ message: 'Saved successfully' });

    } catch (err) {
        // In case of an error, rollback the transaction
        await client.query('ROLLBACK');
        console.error('Error saving smoothie usage:', err);
        res.status(500).json({ error: 'Transaction failed' });
    } finally {
        // Release the client connection
        client.release();
    }
};


const getSmoothieProductionByDate = async (req, res) => {
    console.log('Received request to getSmoothieProductionByDate');
    const { fromDate, toDate } = req.query;

    try {
        const result = await pool.query(`SELECT * FROM smoothie_production WHERE created_at BETWEEN $1 AND $2 ORDER BY id ASC`, [fromDate, toDate]);
        console.log('Query successful:', result.rows);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching getSmoothieProductionByDate smoothies:', err.message);
        res.status(500).json({ error: err.message });
    }
}

const getDrivers = async (req, res) => {
    console.log('Received request to getDrivers');

    try {
        const result = await pool.query('SELECT * FROM drivers');
        console.log('Query successful:', result.rows);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching drivers:', err.message);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }

}

const preDispatch = async (req, res) => {
    try {
        const { driver_name, status, items } = req.body; // Receiving data from frontend

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO predispatches (driver_name, status, items)
                VALUES ($1, $2, $3)
            `;

            const values = [
                driver_name,       // Driver's name
                status,            // Dispatch status
                JSON.stringify(items) // Convert the array into a JSON string
            ];

            // Corrected to use client.query instead of pool.query
            await client.query(query, values);

            await client.query('COMMIT');
            res.status(200).json({ message: 'Dispatch inserted successfully' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Transaction failed:', err);
            res.status(500).json({ message: 'Dispatch insertion failed' });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error connecting to DB:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPreDispatches = async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM predispatches ORDER BY dispatch_date DESC');
        client.release();

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching dispatches:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


// Finalize a pre-dispatch: create a dispatch record, mark predispatch as completed,
// and update smoothie_production cotton (deduct net transferred = transfer_qty - returns)
const completeDispatch = async (req, res) => {
    try {
        const { pre_dispatch_id, driver_name, truck_no, items } = req.body;

        if (!pre_dispatch_id || !driver_name || !truck_no || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert into dispatches table
            const insertQuery = `
                INSERT INTO dispatches (driver_name, truck_no, creation_date, item_details)
                VALUES ($1, $2, NOW(), $3::jsonb)
                RETURNING id
            `;
            const inserted = await client.query(insertQuery, [
                driver_name,
                truck_no,
                JSON.stringify(items)
            ]);

            // Update predispatch status to Completed
            await client.query(
                `UPDATE predispatches SET status = 'Completed' WHERE id = $1`,
                [pre_dispatch_id]
            );

            // For each item, deduct cotton from smoothie_production by net transfer
            for (const item of items) {
                const itemId = item.item_id;
                const qty = Number(item.transfer_qty) || 0;
                const ret = Number(item.returns) || 0;
                const net = qty - ret;
                if (!itemId || net <= 0) continue;

                await client.query(
                    `UPDATE smoothie_production
                     SET cotton = GREATEST((cotton::numeric - $1), 0)
                     WHERE id = $2`,
                    [net, itemId]
                );
            }

            await client.query('COMMIT');
            res.status(200).json({ message: 'Dispatch completed', dispatch_id: inserted.rows[0].id });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Complete dispatch failed:', err);
            res.status(500).json({ message: 'Complete dispatch failed' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to DB:', error);
        res.status(500).json({ message: 'Server error' });
    }
};







module.exports = {
    // getStorage,
    getStorageByDate,
    getStorageByDate2,
    postStorage,
    postStorage2,
    transferLifeSmoothi,
    transferLifeSmoothi2,
    getLifeSmoothie,
    getLifeSmoothieByDate,
    postSmoothie,
    getSmoothies,
    getIngredientsByNames,
    saveSmoothieProduction,
    getSmoothieProductionByDate,
    getDrivers,
    preDispatch,
    getPreDispatches,
    completeDispatch,
}