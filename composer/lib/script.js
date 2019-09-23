/**
 * Shipper will update the acceleration reading for the shipment.
 * @param {org.reliance.network.AccelerationReadingTx} tx The Acceration Reading Transaction invoked by Shipper
 * @transaction
 */
async function accelerationReadingTx (tx) {
	// Define factory and transaction initiator variables.
	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if(!(me.instanceOf(NS+'.Shipper'))){
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

	const acceleration = 1.2

	// Emit Acceleration Event in case of current value is greter then threshold value
	if(acceleration > maxThresholdAcceleration){
			let accelerationEvent = getFactory().newEvent(NS,'AccelerationThreshold');
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
async function temperatureReadingTx (tx) {
	// Define factory and transaction initiator variables.
	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if(!(me.instanceOf(NS+'.Shipper'))){
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

	if((currentTemparature >= minTemparature) && (currentTemparature <= maxTemparature)){
			let temparatureEvent = getFactory().newEvent(NS,'TemparatureThreshold');
			temparatureEvent.temparature = tx.celsius;
			temparatureEvent.message = "Temparature is out of range.";
			temparatureEvent.latitude = tx.latitude;
			temparatureEvent.longitude = tx.longitude;
			temparatureEvent.readingTime = new Date();
      		temparatureEvent.shipment = shipment;
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
async function gpsReadingTx (tx) {

	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if(!(me.instanceOf(NS+'.Shipper'))){
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
	

	let shipmentInPortEvent = getFactory().newEvent(NS,'ShipmentInPort');
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
async function shipmentReceived (tx) {

	let NS = 'org.reliance.network';
	let me = getCurrentParticipant();
	if(!(me.instanceOf(NS+'.Shipper'))){
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
	
	//Calculate total Payout
	const unitPrice = contract.unitPrice;
	const unitCount = shipment.unitCount;
	const totalPayout = unitCount * unitPrice;

	//Update Shipment status as Arrived
	shipment.status = 'ARRIVED';

	//Make payout of 0 of Shipment is late
	const arrivalTime = new Date(contract.arrivalTime);
	const actualArrivalTime = new Date();
	if(actualArrivalTime >= arrivalTime){
		totalPayout = 0;
	}

	//calculate deviation for temparature and payout
 

	const importer = contract.importer.getIdentifier();
	const exporter = contract.exporter.getIdentifier();
	const shipper =  contract.shipper.getIdentifier();
	
	const participantRegistary = await getParticipantRegistry('org.reliance.network.User');
	//update balance of Importer

	const importerParticipant = await participantRegistary.get(importer)
	.catch(function (error) {
		throw new Error('Unable to get Importer Participant.');
	});

	if(totalPayout > importerParticipant.balance ){
		throw new Error('Importer Doesnot have sufficient balance for payout');
	}
	importerParticipant.balance -= totalPayout;

	await participantRegistary.update(importerParticipant)
	.catch(function (error) {
		throw new Error('Unable to update Importer Participant.');
	});


	//update balance of Exporter
	
	const exporterParticipant = await participantRegistary.get(exporter)
	.catch(function (error) {
		throw new Error('Unable to get Exporter Participant.');
	});

	exporterParticipant.balance += totalPayout;

	await participantRegistary.update(exporterParticipant)
	.catch(function (error) {
		throw new Error('Unable to update Importer Participant.');
	});


	//update balance of Shipper

	//update shipment
	await shipmentAssetRegistry.update(shipment)
		.catch(function (error) {
			throw new Error(`Unable to update Shipment:${shipment.shipmentId}:${error}`);
		});
}