/**
 * Shipper will update the acceleration reading for the shipment.
 * @param {org.reliance.network.AccelerationReadingTx} tx The Acceration Reading Transaction invoked by Shipper
 * @transaction
 */
async function accelerationReadingTx(tx) {
	// Define factory and transaction initiator variables.
	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if (!(me.instanceOf(NS + '.Shipper'))) {
		throw new Error(`Only Shipper can invoke this transaction.`);
	}
	//Get the Shipment Asset from registry with ShipmentId
	let shipmentAssetRegistry = await getAssetRegistry(NS + '.Shipment');
	const shipment = await shipmentAssetRegistry.get(tx.shipment.shipmentId)
		.catch(function (error) {
			throw new Error(`shipment with ID: ${tx.shipment.shipmentId} does not exists.`);
		});
	//Get the Contract Asset from registry with contractId
	let contractAssetRegistry = await getAssetRegistry(NS + '.Contract');
	const contract = await contractAssetRegistry.get(shipment.contract.getIdentifier())
		.catch(function (error) {
			throw new Error(`Contract with ID: ${shipment.contract} does not exists.`);
		});

	const maxThresholdAcceleration = contract.maxAcceleration;

	//calculate acceleration based on transaction input

	const acceleration = Math.sqrt(
		Math.pow(tx.accelerationX, 2)
		+ Math.pow(tx.accelerationY, 2)
		+ Math.pow(tx.accelerationZ, 2)
	);

	// Emit Acceleration Event in case of current value is greter then threshold value
	if (acceleration > maxThresholdAcceleration) {
		let accelerationEvent = getFactory().newEvent(NS, 'AccelerationThreshold');
		accelerationEvent.accelerationX = tx.accelerationX;
		accelerationEvent.accelerationY = tx.accelerationY;
		accelerationEvent.accelerationZ = tx.accelerationZ;
		accelerationEvent.latitude = tx.latitude;
		accelerationEvent.longitude = tx.longitude;
		accelerationEvent.readingTime = new Date();
		accelerationEvent.message = "Acceleration Threshold crossed.";
		accelerationEvent.shipment = shipment;
		emit(accelerationEvent);
	}

	//Push current reading is acceleration reading array
	shipment.accelerationReading.push(tx);

	//Update the shipment registry with new readings

	await shipmentAssetRegistry.update(shipment)
		.catch(function (error) {
			throw new Error(`Unable to update Shipment:${shipment.shipmentId}:${error}`);
		});
}


/**
 * Shipper will update the Temparature reading for the shipment.
 * @param {org.reliance.network.TemperatureReadingTx} tx The Temparature Reading Transaction invoked by Shipper
 * @transaction
 */
async function temperatureReadingTx(tx) {
	// Define factory and transaction initiator variables.
	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if (!(me.instanceOf(NS + '.Shipper'))) {
		throw new Error(`Only Shipper can invoke this transaction.`);
	}
	//Get the Shipment Asset from registry with ShipmentId
	let shipmentAssetRegistry = await getAssetRegistry(NS + '.Shipment');
	const shipment = await shipmentAssetRegistry.get(tx.shipment.shipmentId)
		.catch(function (error) {
			throw new Error(`shipment with ID: ${tx.shipment.shipmentId} does not exists.`);
		});
	//Get the Contract Asset from registry with contractId
	let contractAssetRegistry = await getAssetRegistry(NS + '.Contract');
	const contract = await contractAssetRegistry.get(shipment.contract.getIdentifier())
		.catch(function (error) {
			throw new Error(`Contract with ID: ${shipment.contract} does not exists.`);
		});

	// Get minmum and maximum temparature from Contract

	const minTemparature = contract.minTemparature;
	const maxTemparature = contract.maxTemparature;


	// Emit Temparature Event in case of current value of temparature is not in the range defined
	const currentTemparature = tx.celsius;

	if ((currentTemparature <= minTemparature) || (currentTemparature >= maxTemparature)) {
		let temparatureEvent = getFactory().newEvent(NS, 'TemparatureThreshold');
		temparatureEvent.temparature = tx.celsius;
		temparatureEvent.message = "Temparature is out of range.";
		temparatureEvent.latitude = (tx.latitude).toString();
		temparatureEvent.longitude = (tx.longitude).toString();
		temparatureEvent.readingTime = new Date();
		temparatureEvent.shipment = shipment;
      	emit(temparatureEvent);
	}

	//Push current reading is acceleration reading array
	shipment.temparatureReading.push(tx);

	//Update the shipment registry with new readings

	await shipmentAssetRegistry.update(shipment)
		.catch(function (error) {
			throw new Error(`Unable to update Shipment:${shipment.shipmentId}:${error}`);
		});
}

/**
 * Shipper will update the GPS reading for the shipment.
 * @param {org.reliance.network.GpsReadingTx} tx The GPS Reading Transaction invoked by Shipper
 * @transaction
 */
async function gpsReadingTx(tx) {

	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if (!(me.instanceOf(NS + '.Shipper'))) {
		throw new Error(`Only Shipper can invoke this transaction.`);
	}

	//Get the Shipment Asset from registry with ShipmentId
	let shipmentAssetRegistry = await getAssetRegistry(NS + '.Shipment');
	const shipment = await shipmentAssetRegistry.get(tx.shipment.shipmentId)
		.catch(function (error) {
			throw new Error(`shipment with ID: ${tx.shipment.shipmentId} does not exists.`);
		});

	//Get the Contract Asset from registry with contractId
	let contractAssetRegistry = await getAssetRegistry(NS + '.Contract');
	const contract = await contractAssetRegistry.get(shipment.contract.getIdentifier())
		.catch(function (error) {
			throw new Error(`Contract with ID: ${shipment.contract} does not exists.`);
		});

	// Get minmum and maximum panalty factor from Contract

	const minPenaltyFactor = contract.minPenaltyFactor;
	const maxPenaltyFactor = contract.maxPenaltyFactor;


	// Emit shipment Event in case of current location matches importer location
	const currentLatitude = tx.latitude;
	const currentLatitudeDirection = tx.latitudeDirection;
	const currentLongitude = tx.longitude;
	const currentLongitudeDirection = tx.longitudeDirection;


	let shipmentInPortEvent = getFactory().newEvent(NS, 'ShipmentInPort');
	shipmentInPortEvent.message = "Shipment Received by Shipper.";
	shipmentInPortEvent.shipment = shipment;
	emit(shipmentInPortEvent);

	//Push current reading is GPS reading array
	shipment.gpsReading.push(tx);

	//Update the shipment registry with new readings

	await shipmentAssetRegistry.update(shipment)
		.catch(function (error) {
			throw new Error(`Unable to update Shipment:${shipment.shipmentId}:${error}`);
		});
}

/**
 *  This transaction will notify whether the shipment has been successfully received by the importer. 
 * @param {org.reliance.network.ShipmentReceived} tx 
 * @transaction
 */
async function shipmentReceived(tx) {

	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if (!(me.instanceOf(NS + '.Importer'))) {
		throw new Error(`Only Importer can invoke this transaction.`);
	}

	//Get the Shipment Asset from registry with ShipmentId
	let shipmentAssetRegistry = await getAssetRegistry(NS + '.Shipment');
	const shipment = await shipmentAssetRegistry.get(tx.shipment.shipmentId)
		.catch(function (error) {
			throw new Error(`shipment with ID: ${tx.shipment.shipmentId} does not exists.`);
		});

	//Get the Contract Asset from registry with contractId
	let contractAssetRegistry = await getAssetRegistry(NS + '.Contract');
	const contract = await contractAssetRegistry.get(shipment.contract.getIdentifier())
		.catch(function (error) {
			throw new Error(`Contract with ID: ${shipment.contract} does not exists.`);
		});

	//Calculate total Payout
	const unitPrice = contract.unitPrice;
	const unitCount = shipment.unitCount;
	let totalPayout = unitCount * unitPrice;

	//Update Shipment status as Arrived
	shipment.status = 'ARRIVED';

	//Make payout to 0 if Shipment is late
	const arrivalTime = new Date(contract.arrivalTime);
	const actualArrivalTime = new Date();
	if (actualArrivalTime >= arrivalTime) {
		totalPayout = 0;
	}



	//calculate deviation for temparature and payout
	let tempPanaltyFactor = calculateTempPanaltyFactor(shipment.temparatureReading, contract.minTemparature, contract.MaxTemparature, contract.minPenaltyFactor, contract.maxPenaltyFactor);

	//calculate acceleration 
	let accelerationFactor = calculateAccelerationFactor(shipment.accelerationReading, contract.maxAcceleration);
//	throw new Error(`accelerationFactor:${accelerationFactor} tempPanaltyFactor:${tempPanaltyFactor}`);
	const totalPanalty = accelerationFactor + tempPanaltyFactor;

	//calculate total panalty
	const totalPanalyAmount = unitCount * totalPanalty;


	totalPayout -= totalPanalyAmount;

	if (totalPayout < 0) {
		totalPayout = 0;
	}

	const importer = contract.importer.getIdentifier();
	const exporter = contract.exporter.getIdentifier();
	const shipper = contract.shipper.getIdentifier();

	const importerParticipantRegistary = await getParticipantRegistry('org.reliance.network.Importer');
	//update balance of Importer

	const importerParticipant = await importerParticipantRegistary.get(importer)
		.catch(function (error) {
			throw new Error(`Unable to get Importer ${importer} Participant. ${error}`);
		});

	if (totalPayout > importerParticipant.balance) {
		throw new Error('Importer Doesnot have sufficient balance for payout');
	}
  	//throw new Error(`total Payout:${totalPayout}`)
	importerParticipant.balance = importerParticipant.balance - totalPayout;


	await importerParticipantRegistary.update(importerParticipant)
		.catch(function (error) {
			throw new Error(`Unable to update Importer ${importer} Participant. ${error}`);
		});


	//update balance of Exporter
	const exporterParticipantRegistary = await getParticipantRegistry('org.reliance.network.Exporter');

	const exporterParticipant = await exporterParticipantRegistary.get(exporter)
		.catch(function (error) {
			throw new Error('Unable to get Exporter Participant.');
		});

	exporterParticipant.balance += totalPayout;

	await exporterParticipantRegistary.update(exporterParticipant)
		.catch(function (error) {
			throw new Error('Unable to update Exporter Participant.');
		});
	
	//update balance of Shipper
  	const shipperParticipantRegistary = await getParticipantRegistry('org.reliance.network.Shipper');

	const shipperParticipant = await shipperParticipantRegistary.get(shipper)
		.catch(function (error) {
			throw new Error('Unable to get Shipper Participant.');
		});

	shipperParticipant.balance -= totalPanalty;

	await shipperParticipantRegistary.update(shipperParticipant)
		.catch(function (error) {
			throw new Error('Unable to update Shipper Participant.');
		});


	//update shipment
	await shipmentAssetRegistry.update(shipment)
		.catch(function (error) {
			throw new Error(`Unable to update Shipment:${shipment.shipmentId}:${error}`);
		});
}

function calculateTempPanaltyFactor(tempReadingArr, minTemp, maxTemp, minPenaltyFactor, maxPenaltyFactor) {

	let recordedMinTemp = minTemp;
	let recordedMaxTemp = maxTemp;
	let reading, celsiusMinReading;

	tempReadingArr.map(tempReading => {
		celsiusMinReading = JSON.parse(JSON.stringify(tempReading)).celsius
		if (celsiusMinReading < recordedMinTemp) {
			recordedMinTemp = celsiusMinReading;
		}
	});

	let celsiusMaxReading;
	tempReadingArr.map(tempReading => {
		celsiusMaxReading = JSON.parse(JSON.stringify(tempReading)).celsius
		if (celsiusMaxReading > recordedMaxTemp) {
			recordedMaxTemp = celsiusMaxReading;
		}
	});
	let minTempPanalty = (minTemp - recordedMinTemp) * minPenaltyFactor;
	let maxTempPanalty = (recordedMaxTemp - maxTemp) * maxPenaltyFactor;

	let panaltyFactor = (minTempPanalty + maxTempPanalty) / 2;
	return Number((panaltyFactor).toFixed(2));
}


function calculateAccelerationFactor(accelerationReadingArr, maxAcceleration) {

	let recordedAcceleration = maxAcceleration;

	let accelerationX, accelerationY, accelerationZ;
  
  	let maxAcc = maxAcceleration;

	accelerationReadingArr.map(acceleration => {
		accelerationX = JSON.parse(JSON.stringify(acceleration)).accelerationX;
		accelerationY = JSON.parse(JSON.stringify(acceleration)).accelerationY;
		accelerationZ = JSON.parse(JSON.stringify(acceleration)).accelerationZ;


		recordedAcceleration = Math.sqrt(
			Math.pow(accelerationX, 2)
			+ Math.pow(accelerationY, 2)
			+ Math.pow(accelerationZ, 2)
		);

		if (recordedAcceleration > maxAcceleration) {
			maxAcc = recordedAcceleration;
		}
	});

	const maxAccelerationPanaltyFactor = (maxAcc - maxAcceleration) * 0.2;

	return Number((maxAccelerationPanaltyFactor).toFixed(2));
}